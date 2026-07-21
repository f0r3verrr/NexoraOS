import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase.js';
import { useAdminAction } from './useAdminAction.js';

export function useFeedbackAdmin(statusFilter, archived = false) {
  return useQuery({
    queryKey: ['admin', 'feedback', statusFilter, archived],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_feedback', { status_filter: statusFilter || null, p_archived: archived });
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

export function useSetFeedbackArchived() {
  return useAdminAction(async ({ id, archived }) => {
    const { error } = await supabase.rpc('admin_set_feedback_archived', { p_id: id, p_archived: archived });
    if (error) throw error;
  });
}

export function useReplyFeedback() {
  return useAdminAction(async ({ id, body, attachments = [] }) => {
    const { error } = await supabase.rpc('admin_reply_feedback', { p_id: id, p_body: body, p_attachments: attachments });
    if (error) throw error;
  });
}

/* Полная лента сообщений тикета — опрашиваем, пока чат открыт, чтобы новые
   сообщения пользователя приходили без ручного обновления страницы. */
export function useFeedbackThread(id) {
  return useQuery({
    queryKey: ['admin', 'feedback-thread', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_feedback_thread', { p_id: id });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
    refetchInterval: 4000,
    retry: false,
  });
}
