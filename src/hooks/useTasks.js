import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

function dayBounds(offsetDays = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  const start = d.toISOString();
  d.setDate(d.getDate() + 1);
  const end = d.toISOString();
  return { start, end };
}

const TASK_SELECT = '*, project:projects(id, name, color_token, area)';

/* Tasks due strictly TODAY (between today 00:00 and tomorrow 00:00) */
export function useTodayTasks() {
  const { start, end } = dayBounds(0);
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .gte('due_at', start)
        .lt('due_at', end)
        .order('due_at', { ascending: true })
        .order('priority', { ascending: true, nullsLast: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Tasks past their due date that are not done */
export function useOverdueTasks() {
  const { start } = dayBounds(0);
  return useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .lt('due_at', start)
        .not('due_at', 'is', null)
        .eq('done', false)
        .order('due_at', { ascending: true })
        .order('priority', { ascending: true, nullsLast: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Tasks with no due date — includes done for accurate progress counting */
export function useUndatedTasks() {
  return useQuery({
    queryKey: ['tasks', 'undated'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .is('due_at', null)
        .order('done', { ascending: true })      // undone first
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* All tasks for Gantt — includes done tasks for correct progress calculation */
export function useGanttTasks() {
  return useQuery({
    queryKey: ['tasks', 'gantt'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .order('due_at', { ascending: true, nullsLast: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* All incomplete tasks — used by Kanban, Gantt etc. */
export function useAllTasks() {
  return useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .eq('done', false)
        .order('due_at', { ascending: true, nullsLast: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Parse "!p1 !p2 !p3" priority tags from task title */
export function parseTaskInput(text) {
  let title = text.trim();
  let priority = null;
  let due_at = null;

  const pMatch = title.match(/!p([123])/i);
  if (pMatch) {
    priority = parseInt(pMatch[1], 10);
    title = title.replace(/!p[123]/i, '').trim();
  }

  // Simple time parser: "в 15:00" or "в 15"
  const timeMatch = title.match(/\bв\s+(\d{1,2})(?::(\d{2}))?\b/i);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2] ?? '0', 10);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    due_at = d.toISOString();
    title = title.replace(timeMatch[0], '').trim();
  }

  return { title, priority, due_at };
}

/* All tasks grouped by kanban_status */
export function useKanbanTasks() {
  return useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Overdue incomplete tasks — for notification count */
export function useOverdueCount() {
  return useQuery({
    queryKey: ['tasks', 'overdue_count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { count, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lt('due_at', new Date().toISOString())
        .not('due_at', 'is', null)
        .eq('done', false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
}

/* Frog of the day — highest priority incomplete task due today */
export function useFrogTask() {
  const { end } = dayBounds(0);
  return useQuery({
    queryKey: ['tasks', 'frog'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .lte('due_at', end)
        .not('due_at', 'is', null)
        .eq('done', false)
        .order('priority', { ascending: true, nullsLast: true })
        .order('due_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/* Move task to a kanban column (+ sync done flag) */
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, kanban_status }) => {
      const isDone = kanban_status === 'done';
      const { error } = await supabase
        .from('tasks')
        .update({ kanban_status, done: isDone, done_at: isDone ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, kanban_status }) => {
      await qc.cancelQueries({ queryKey: ['tasks', 'kanban'] });
      const prev = qc.getQueryData(['tasks', 'kanban']);
      qc.setQueryData(['tasks', 'kanban'], old =>
        old?.map(t => t.id === id ? { ...t, kanban_status, done: kanban_status === 'done' } : t)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['tasks', 'kanban'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, priority = null, due_at = null, project_id = null, kanban_status = 'todo', contact_id = null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, title, priority, due_at, project_id, kanban_status, contact_id })
        .select(TASK_SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useContactTasks(contactId) {
  return useQuery({
    queryKey: ['tasks', 'contact', contactId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!contactId,
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }) => {
      const patch = {
        done,
        done_at: done ? new Date().toISOString() : null,
        ...(done ? { kanban_status: 'done' } : {}),
      };
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    // Optimistic: flip immediately in all task caches
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const prev = {};
      for (const key of [['tasks','today'], ['tasks','undated'], ['tasks','all'], ['tasks','overdue']]) {
        prev[key.join('/')] = qc.getQueryData(key);
        qc.setQueryData(key, (old) =>
          old?.map(t => t.id === id ? { ...t, done } : t)
        );
      }
      return prev;
    },
    onError: (_err, _vars, prev) => {
      for (const [k, v] of Object.entries(prev ?? {})) {
        qc.setQueryData(k.split('/'), v);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

/* Generic patch — title, notes, priority, due_at, project_id, kanban_status, etc. */
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
