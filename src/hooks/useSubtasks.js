import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useSubtasks(taskId) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!taskId,
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task_id, title }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('task_subtasks')
        .insert({ user_id: user.id, task_id, title })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['subtasks', vars.task_id] }),
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }) => {
      const { error } = await supabase.from('task_subtasks').update({ done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, vars, ctx) => qc.invalidateQueries({ queryKey: ['subtasks'] }),
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('task_subtasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subtasks'] }),
  });
}
