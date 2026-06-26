import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('archived', false)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Logs for the past N days — returns { [habitId]: Set<dateString> } */
export function useHabitLogs(days = 30) {
  const from = isoDate(new Date(Date.now() - days * 86400000));
  return useQuery({
    queryKey: ['habit_logs', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('habit_id, date, done')
        .gte('date', from)
        .eq('done', true);
      if (error) throw error;
      const map = {};
      for (const row of data ?? []) {
        if (!map[row.habit_id]) map[row.habit_id] = new Set();
        map[row.habit_id].add(row.date);
      }
      return map;
    },
  });
}

/* Toggle a single habit log for today */
export function useToggleHabitLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date = isoDate(), done }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (done) {
        const { error } = await supabase
          .from('habit_logs')
          .upsert({ user_id: user.id, habit_id: habitId, date, done: true }, { onConflict: 'habit_id,date' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', date);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit_logs'] }),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color_token = '--p-health', area }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: user.id, name, color_token, area })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

/* Streak = consecutive days with done=true ending today */
export function calcStreak(habitId, logsMap) {
  const logs = logsMap[habitId];
  if (!logs) return 0;
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = isoDate(d);
    if (!logs.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
