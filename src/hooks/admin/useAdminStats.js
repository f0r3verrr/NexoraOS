import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_stats');
      if (error) throw error;
      return data;
    },
    retry: false,
  });
}
