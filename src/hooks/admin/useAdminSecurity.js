import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

export function useAdminSecurity() {
  return useQuery({
    queryKey: ['admin', 'security'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_security_stats');
      if (error) throw error;
      return data;
    },
    retry: false,
  });
}
