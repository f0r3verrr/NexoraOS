import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

export function useAdminAnalytics(range) {
  return useQuery({
    queryKey: ['admin', 'analytics', range],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_analytics', { p_range: range });
      if (error) throw error;
      return data;
    },
    retry: false,
  });
}
