import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useContactReminders(contactId) {
  return useQuery({
    queryKey: ['contact_reminders', contactId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('contact_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('remind_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!contactId,
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contact_id, body, remind_at }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('contact_reminders')
        .insert({ contact_id, body, remind_at, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['contact_reminders', vars.contact_id] }),
  });
}

export function useToggleReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }) => {
      const { error } = await supabase.from('contact_reminders').update({ done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['contact_reminders', vars.contact_id] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id }) => {
      const { error } = await supabase.from('contact_reminders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['contact_reminders', vars.contact_id] }),
  });
}
