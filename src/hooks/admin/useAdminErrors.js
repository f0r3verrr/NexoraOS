import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useAdminErrors(statusFilter) {
  return useQuery({
    queryKey: ['admin', 'errors', statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_errors', { status_filter: statusFilter || null });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useResolveError() {
  return useAdminAction(async (id) => {
    const { error } = await supabase.rpc('admin_resolve_error', { p_id: id });
    if (error) throw error;
  });
}
