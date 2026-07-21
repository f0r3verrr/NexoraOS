import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

export function useAdminLogs({ limit = 100 } = {}) {
  return useQuery({
    queryKey: ['admin', 'logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_logs', { limit_n: limit });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}
