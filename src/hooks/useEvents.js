import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const SEL = '*, project:projects(id, name, color_token)';

/* ─── Recurrence expansion ───────────────────────────────── */
const RECURRING_VALUES = ['daily','weekly','weekdays','monthly','yearly'];

function advanceDate(d, recurrence) {
  switch (recurrence) {
    case 'daily':    d.setDate(d.getDate() + 1); break;
    case 'weekly':   d.setDate(d.getDate() + 7); break;
    case 'monthly':  d.setMonth(d.getMonth() + 1); break;
    case 'yearly':   d.setFullYear(d.getFullYear() + 1); break;
    case 'weekdays':
      do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
      break;
  }
}

function expandForRange(ev, rangeStart, rangeEnd) {
  if (!ev.recurrence || ev.recurrence === 'none') return [];
  const instances = [];
  const base = new Date(ev.start_at);
  const dur  = new Date(ev.end_at) - base;
  const cur  = new Date(base);
  let safety = 0;
  while (cur < rangeEnd && safety++ < 2000) {
    if (cur >= rangeStart) {
      instances.push({
        ...ev,
        start_at: new Date(cur.getTime()).toISOString(),
        end_at:   new Date(cur.getTime() + dur).toISOString(),
        _recurring: true,
      });
    }
    advanceDate(cur, ev.recurrence);
  }
  return instances;
}

async function fetchWithRecurring(rangeStart, rangeEnd) {
  const [directRes, recurringRes] = await Promise.all([
    supabase.from('events').select(SEL)
      .gte('start_at', rangeStart.toISOString())
      .lt('start_at', rangeEnd.toISOString())
      .order('start_at'),
    supabase.from('events').select(SEL)
      .in('recurrence', RECURRING_VALUES)
      .lt('start_at', rangeStart.toISOString())
      .order('start_at'),
  ]);
  if (directRes.error) throw directRes.error;
  const expanded = (recurringRes.data ?? []).flatMap(ev => expandForRange(ev, rangeStart, rangeEnd));
  return [...directRes.data, ...expanded].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
}

/* ─── Hooks ──────────────────────────────────────────────── */
export function useDayEvents(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  const end   = new Date(d); end.setDate(d.getDate() + 1);
  return useQuery({
    queryKey: ['events', 'day', start.toISOString()],
    queryFn: () => fetchWithRecurring(start, end),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useWeekEvents(weekStart) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return useQuery({
    queryKey: ['events', 'week', start.toISOString()],
    queryFn: () => fetchWithRecurring(start, end),
  });
}

export function useMonthEvents(year, month) {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end   = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return useQuery({
    queryKey: ['events', 'month', year, month],
    queryFn: () => fetchWithRecurring(start, end),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, start_at, end_at, all_day = false, color_token, project_id = null, is_deadline = false, location, notes, url, recurrence = 'none' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('events')
        .insert({ user_id: user.id, title, start_at, end_at, all_day, color_token, project_id, is_deadline, location, notes, url: url || null, recurrence })
        .select(SEL).single();
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
