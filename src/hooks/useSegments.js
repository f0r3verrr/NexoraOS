import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useSegments() {
  return useQuery({
    queryKey: ['crm_segments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_segments')
        .insert({ user_id: user.id, name })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_segments'] }),
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }) => {
      const { error } = await supabase
        .from('crm_segments')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm_segments'] }),
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('crm_segments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm_segments'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
