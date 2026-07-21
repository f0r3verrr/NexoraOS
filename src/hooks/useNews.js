import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

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
