import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/* All entries for the past year — used for heatmap */
export function useJournalEntries() {
  const from = isoDate(new Date(Date.now() - 365 * 86400000));
  return useQuery({
    queryKey: ['journal', 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, date, mood, energy')
        .eq('user_id', user.id)
        .gte('date', from)
        .order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Single entry for a given date (default = today) */
export function useJournalEntry(date = isoDate()) {
  return useQuery({
    queryKey: ['journal', 'entry', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

/* Last N days of journal entries (for sidebar panel) */
export function useRecentJournalEntries(days = 7) {
  const from = isoDate(new Date(Date.now() - (days - 1) * 86400000));
  return useQuery({
    queryKey: ['journal', 'recent', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('date, mood, energy')
        .eq('user_id', user.id)
        .gte('date', from)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* Consecutive-day journal streak */
export function useJournalStreak() {
  return useQuery({
    queryKey: ['journal', 'streak'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(400);
      if (error) throw error;
      const dates = new Set((data ?? []).map(e => e.date));
      let streak = 0;
      const d = new Date();
      // If today has no entry yet, allow streak from yesterday
      const todayStr = d.toISOString().slice(0, 10);
      if (!dates.has(todayStr)) d.setDate(d.getDate() - 1);
      for (let i = 0; i < 400; i++) {
        const s = d.toISOString().slice(0, 10);
        if (dates.has(s)) { streak++; d.setDate(d.getDate() - 1); }
        else break;
      }
      return streak;
    },
  });
}

/* Delete entry for a date */
export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); },
  });
}

/* Create or update entry for a date */
export function useUpsertJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date = isoDate(), mood, energy, body }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('journal_entries')
        .upsert(
          { user_id: user.id, date, ...(mood !== undefined && { mood }), ...(energy !== undefined && { energy }), ...(body !== undefined && { body }) },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['journal', 'entry', vars.date ?? isoDate()] });
      qc.invalidateQueries({ queryKey: ['journal', 'all'] });
    },
  });
}
