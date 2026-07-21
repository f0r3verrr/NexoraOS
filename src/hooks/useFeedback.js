import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/* Собственные тикеты пользователя — RLS ("feedback own select") и так
   ограничивает выборку владельцем, доп. фильтр не нужен. */
export function useMyFeedback() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['feedback', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase.from('feedback_items').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useFeedbackItem(id) {
  return useQuery({
    queryKey: ['feedback', 'item', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('feedback_items').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/* Лента ответов открытого тикета — опрашиваем раз в 4с, пока чат открыт,
   чтобы новые сообщения (в т.ч. от админа) появлялись без ручного обновления. */
export function useFeedbackThread(id) {
  return useQuery({
    queryKey: ['feedback', 'thread', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('feedback_replies').select('*').eq('feedback_id', id).order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
    refetchInterval: 4000,
  });
}

export function useCreateFeedback() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ type, title, body }) => {
      const { data, error } = await supabase.from('feedback_items')
        .insert({ user_id: user.id, type, title, body }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback', 'mine'] }),
  });
}

export function useSendFeedbackReply(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const { error } = await supabase.rpc('reply_feedback', { p_id: id, p_body: body });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', 'thread', id] });
      qc.invalidateQueries({ queryKey: ['feedback', 'item', id] });
      qc.invalidateQueries({ queryKey: ['feedback', 'mine'] });
    },
  });
}
