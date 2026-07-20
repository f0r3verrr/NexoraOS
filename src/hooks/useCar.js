import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/* ─── Профиль машины (одна строка на пользователя) ───────── */
export function useCarProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['car', 'profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('car_profile').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpsertCarProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch) => {
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['car', 'deadlines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_deadlines').select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useSaveCarDeadline() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('car_deadlines').update(fields).eq('id', id);
        if (error) throw error;
      } else {
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['car', 'service'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_service').select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useSaveCarService() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('car_service').update(fields).eq('id', id);
        if (error) throw error;
      } else {
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
