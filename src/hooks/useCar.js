import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/* ─── Профиль машины (одна строка на пользователя) ───────── */
export function useCarProfile() {
  return useQuery({
    queryKey: ['car', 'profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('car_profile').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCarProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('car_profile')
        .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['car'] }),
  });
}

/* ─── Сроки (ОСАГО, ТО и т.п.) ───────────────────────────── */
export function useCarDeadlines() {
  return useQuery({
    queryKey: ['car', 'deadlines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_deadlines').select('*')
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveCarDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('car_deadlines').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('car_deadlines').insert({ user_id: user.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['car', 'deadlines'] }),
  });
}

export function useDeleteCarDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('car_deadlines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['car', 'deadlines'] }),
  });
}

/* ─── Журнал ТО ──────────────────────────────────────────── */
export function useCarService() {
  return useQuery({
    queryKey: ['car', 'service'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_service').select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveCarService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('car_service').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('car_service').insert({ user_id: user.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['car', 'service'] }),
  });
}

export function useDeleteCarService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('car_service').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['car', 'service'] }),
  });
}
