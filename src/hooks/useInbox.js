import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useInboxItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      // элемент "проснулся", если snoozed_until уже в прошлом — он возвращается в общий список
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*, project:projects(id, name, color_token)')
        .eq('user_id', user.id)
        .eq('resolved', false)
        .or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useAddInboxItem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ text, source = 'web' }) => {
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
        .update({ resolved: true, resolved_at: new Date().toISOString() })
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

export function useResolvedItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inbox', 'resolved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*, project:projects(id, name, color_token)')
        .eq('user_id', user.id)
        .eq('resolved', true)
        .order('resolved_at', { ascending: false, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useUnresolveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('inbox_items').update({ resolved: false, resolved_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useSnoozedItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inbox', 'snoozed'],
    queryFn: async () => {
      // только "спящие" (в будущем); проснувшиеся уже показываются в основном списке
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*, project:projects(id, name, color_token)')
        .eq('user_id', user.id)
        .eq('resolved', false)
        .gt('snoozed_until', new Date().toISOString())
        .order('snoozed_until', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}

export function useResolveAllItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useUnresolveAllItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ resolved: false, resolved_at: null })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}

export function useUnsnoozeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ snoozed_until: null })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['inbox'] });
      const prev = qc.getQueryData(['inbox', 'snoozed']);
      qc.setQueryData(['inbox', 'snoozed'], (old) => old?.filter(i => i.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['inbox', 'snoozed'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
}
