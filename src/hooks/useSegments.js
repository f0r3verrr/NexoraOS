import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useSegments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['crm_segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_segments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (name) => {
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
