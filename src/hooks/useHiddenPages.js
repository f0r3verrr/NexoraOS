import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/* Список ключей отключённых страниц (profiles.hidden_pages, jsonb-массив) */
export function useHiddenPages() {
  return useQuery({
    queryKey: ['prefs', 'hidden'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('hidden_pages')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        // колонки ещё нет (миграция 022 не выполнена) — считаем, что всё включено
        if (error.code === '42703' || error.message?.includes('hidden_pages')) return [];
        throw error;
      }
      return data?.hidden_pages ?? [];
    },
    staleTime: 60_000,
  });
}

export function useToggleHiddenPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, hidden }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const current = qc.getQueryData(['prefs', 'hidden']) ?? [];
      const next = hidden
        ? [...new Set([...current, key])]
        : current.filter(k => k !== key);
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, hidden_pages: next }, { onConflict: 'id' });
      if (error) throw error;
      return next;
    },
    onMutate: async ({ key, hidden }) => {
      await qc.cancelQueries({ queryKey: ['prefs', 'hidden'] });
      const prev = qc.getQueryData(['prefs', 'hidden']);
      qc.setQueryData(['prefs', 'hidden'], (old = []) =>
        hidden ? [...new Set([...old, key])] : old.filter(k => k !== key)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['prefs', 'hidden'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['prefs', 'hidden'] }),
  });
}
