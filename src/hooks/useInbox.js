import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useInboxItems() {
  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*, project:projects(id, name, color_token)')
        .eq('resolved', false)
        .is('snoozed_until', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ text, source = 'web' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('inbox_items')
        .insert({ user_id: user.id, text, source })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useResolveInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ resolved: true })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['inbox'] });
      const prev = qc.getQueryData(['inbox']);
      qc.setQueryData(['inbox'], (old) => old?.filter(i => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['inbox'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useSnoozeInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, until }) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ snoozed_until: until })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['inbox'] });
      const prev = qc.getQueryData(['inbox']);
      qc.setQueryData(['inbox'], (old) => old?.filter(i => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['inbox'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useDeleteInboxItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('inbox_items').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['inbox'] });
      const prev = qc.getQueryData(['inbox']);
      qc.setQueryData(['inbox'], (old) => old?.filter(i => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['inbox'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}
