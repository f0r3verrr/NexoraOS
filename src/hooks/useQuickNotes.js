import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useQuickNotes() {
  return useQuery({
    queryKey: ['quick_notes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddQuickNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, color_token = '--p-openresto' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('quick_notes')
        .insert({ user_id: user.id, text, color_token })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quick_notes'] }),
  });
}

export function useDeleteQuickNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('quick_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['quick_notes'] });
      const prev = qc.getQueryData(['quick_notes']);
      qc.setQueryData(['quick_notes'], old => old?.filter(n => n.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['quick_notes'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['quick_notes'] }),
  });
}
