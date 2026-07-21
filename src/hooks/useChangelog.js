import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/* Непрочитанные релизы — только опубликованные и только с даты регистрации пользователя */
export function useUnreadChangelog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['changelog', 'unread'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_changelog');
      if (error) {
        if (error.code === '42883' || error.message?.includes('get_unread_changelog')) return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useMarkChangelogRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.rpc('mark_changelog_read', { ids });
      if (error) throw error;
    },
    onSuccess: () => qc.setQueryData(['changelog', 'unread'], []),
  });
}

/* Полный архив опубликованных релизов — для страницы "Что нового" */
export function useAllChangelog() {
  return useQuery({
    queryKey: ['changelog', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('published', true)
        .order('release_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
