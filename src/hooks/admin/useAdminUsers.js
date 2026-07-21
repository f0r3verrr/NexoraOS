import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useAdminUsers(search) {
  return useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users', { search: search || null });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useAdminUserDetail(id) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_user_detail', { target: id });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    retry: false,
  });
}

export function useBanUser()   { return useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_ban_user', { target: id }); if (error) throw error; }); }
export function useUnbanUser() { return useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_unban_user', { target: id }); if (error) throw error; }); }
export function useDeleteUser(){ return useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_delete_user', { target: id }); if (error) throw error; }); }
export function useVerifyEmail(){ return useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_verify_email', { target: id }); if (error) throw error; }); }
export function useLogoutUserSessions() { return useAdminAction(async (id) => { const { error } = await supabase.rpc('admin_logout_user', { target: id }); if (error) throw error; }); }
export function useSetUserRole() { return useAdminAction(async ({ id, makeAdmin }) => { const { error } = await supabase.rpc('admin_set_role', { target: id, make_admin: makeAdmin }); if (error) throw error; }); }
export function useSetUserSubscription() { return useAdminAction(async ({ id, plan }) => { const { error } = await supabase.rpc('admin_set_subscription', { target: id, new_plan: plan }); if (error) throw error; }); }

export function useResetUserPassword() {
  return useAdminAction(async (id) => {
    const { data, error } = await supabase.rpc('admin_reset_password_manual', { target: id });
    if (error) throw error;
    return data; // временный пароль, показать один раз
  });
}
