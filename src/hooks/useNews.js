import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useUnreadNews() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['news', 'unread'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unread_news');
      if (error) {
        if (error.code === '42883' || error.message?.includes('get_unread_news')) return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useMarkNewsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.rpc('mark_news_read', { ids });
      if (error) throw error;
    },
    onSuccess: () => qc.setQueryData(['news', 'unread'], []),
  });
}

export function useNewsPublic() {
  return useQuery({
    queryKey: ['news', 'public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
