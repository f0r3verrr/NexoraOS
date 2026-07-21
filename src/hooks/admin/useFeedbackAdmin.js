import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useFeedbackAdmin(statusFilter) {
  return useQuery({
    queryKey: ['admin', 'feedback', statusFilter],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_feedback', { status_filter: statusFilter || null });
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
}

export function useSetFeedbackStatus() {
  return useAdminAction(async ({ id, status }) => {
    const { error } = await supabase.rpc('admin_set_feedback_status', { p_id: id, p_status: status });
    if (error) throw error;
  });
}

export function useSetFeedbackPriority() {
  return useAdminAction(async ({ id, priority }) => {
    const { error } = await supabase.rpc('admin_set_feedback_priority', { p_id: id, p_priority: priority });
    if (error) throw error;
  });
}

export function useReplyFeedback() {
  return useAdminAction(async ({ id, body }) => {
    const { error } = await supabase.rpc('admin_reply_feedback', { p_id: id, p_body: body });
    if (error) throw error;
  });
}
