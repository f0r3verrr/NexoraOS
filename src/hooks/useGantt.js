import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const MILESTONE_SELECT = '*, project:projects(id, name, color_token)';
const DEP_SELECT = '*, fromTask:tasks!task_dependencies_from_task_fkey(id, title, start_date, due_at), toTask:tasks!task_dependencies_to_task_fkey(id, title, start_date, due_at)';

/* ─── Milestones ─────────────────────────────────────────────── */

export function useMilestones() {
  return useQuery({
    queryKey: ['milestones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select(MILESTONE_SELECT)
        .order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ project_id, title, date, description = null, color_token = null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('milestones')
        .insert({ user_id: user.id, project_id, title, date, description, color_token })
        .select(MILESTONE_SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('milestones').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['milestones'] }),
  });
}

/* ─── Task Dependencies ──────────────────────────────────────── */

export function useTaskDependencies() {
  return useQuery({
    queryKey: ['task_dependencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select(DEP_SELECT)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ from_task, to_task, dep_type = 'finish_to_start' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({ user_id: user.id, from_task, to_task, dep_type })
        .select(DEP_SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_dependencies'] }),
  });
}

export function useDeleteDependency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('task_dependencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task_dependencies'] }),
  });
}

/* ─── Task date update (for drag & drop) ────────────────────── */

export function useUpdateTaskDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, start_date, due_at }) => {
      const patch = {};
      if (start_date !== undefined) patch.start_date = start_date;
      if (due_at !== undefined) patch.due_at = due_at;
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
