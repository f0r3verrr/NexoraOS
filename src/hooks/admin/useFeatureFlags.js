import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['admin', 'flags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_flags');
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useCreateFlag() {
  return useAdminAction(async ({ key, name, description, audience, status }) => {
    const { error } = await supabase.rpc('admin_create_flag', { p_key: key, p_name: name, p_description: description, p_audience: audience, p_status: status });
    if (error) throw error;
  });
}

export function useUpdateFlag() {
  return useAdminAction(async ({ id, name, description, audience, status }) => {
    const { error } = await supabase.rpc('admin_update_flag', { p_id: id, p_name: name, p_description: description, p_audience: audience, p_status: status });
    if (error) throw error;
  });
}

export function useToggleFlag() {
  return useAdminAction(async ({ id, status }) => {
    const { error } = await supabase.rpc('admin_toggle_flag', { p_id: id, p_status: status });
    if (error) throw error;
  });
}

export function useDeleteFlag() {
  return useAdminAction(async (id) => {
    const { error } = await supabase.rpc('admin_delete_flag', { p_id: id });
    if (error) throw error;
  });
}

export function useSetFlagUsers() {
  return useAdminAction(async ({ id, userIds }) => {
    const { error } = await supabase.rpc('admin_set_flag_users', { p_id: id, p_user_ids: userIds });
    if (error) throw error;
  });
}
