import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useContactActivities(contactId) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact_activities', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!contactId,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ contact_id, type, body }) => {
      const { data, error } = await supabase
        .from('contact_activities')
        .insert({ contact_id, type, body, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['contact_activities', vars.contact_id] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contact_id }) => {
      const { error } = await supabase.from('contact_activities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['contact_activities', vars.contact_id] }),
  });
}
