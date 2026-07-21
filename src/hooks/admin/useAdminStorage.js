import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';

export function useAdminStorageOverview() {
  return useQuery({
    queryKey: ['admin', 'storage'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_storage_overview');
      if (error) throw error;
      return data;
    },
    retry: false,
  });
}

export function useAdminUserStorage(userId) {
  return useQuery({
    queryKey: ['admin', 'user-storage', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_user_storage', { target: userId });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    retry: false,
  });
}
