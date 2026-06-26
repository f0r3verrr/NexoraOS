import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const SEL = '*, project:projects(id, name, color_token)';

function dayRange(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  d.setDate(d.getDate() + 1);
  return { start, end: d.toISOString() };
}

/* Events for a single day */
export function useDayEvents(date = new Date()) {
  const { start, end } = dayRange(date);
  return useQuery({
    queryKey: ['events', 'day', start],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(SEL)
        .gte('start_at', start)
        .lt('start_at', end)
        .order('start_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Events for a week (7-day range starting from weekStart) */
export function useWeekEvents(weekStart) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return useQuery({
    queryKey: ['events', 'week', start.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(SEL)
        .gte('start_at', start.toISOString())
        .lt('start_at', end.toISOString())
        .order('start_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, start_at, end_at, all_day = false, color_token, project_id = null, is_deadline = false, location, notes }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('events')
        .insert({ user_id: user.id, title, start_at, end_at, all_day, color_token, project_id, is_deadline, location, notes })
        .select(SEL)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('events').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}
