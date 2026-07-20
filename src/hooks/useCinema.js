import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useCinema() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cinema'],
    queryFn: async () => {
      // cinema_entries допускает публичное чтение чужих is_public=true записей
      // (для /cinema/public/:userId) — здесь явно фильтруем "мои", иначе в
      // список попадут фильмы всех пользователей с is_public по умолчанию.
      const { data, error } = await supabase
        .from('cinema_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function usePublicCinema(userId) {
  return useQuery({
    queryKey: ['cinema', 'public', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('cinema_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useCreateCinemaEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (entry) => {
      const { data, error } = await supabase
        .from('cinema_entries')
        .insert({ user_id: user.id, ...entry })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cinema'] }),
  });
}

export function useUpdateCinemaEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase
        .from('cinema_entries')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['cinema'] });
      const prev = qc.getQueryData(['cinema']);
      qc.setQueryData(['cinema'], old => old?.map(e => e.id === id ? { ...e, ...patch } : e));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['cinema'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['cinema'] }),
  });
}

export function useDeleteCinemaEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('cinema_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cinema'] }),
  });
}
