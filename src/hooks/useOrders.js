import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

const ORDER_SELECT = '*, project:projects(id, name, color_token), contact:contacts(id, name)';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ description, amount = 0, status = 'Новый', project_id = null, contact_id = null, deadline = null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('orders')
        .insert({ user_id: user.id, description, amount, status, project_id, contact_id, deadline })
        .select(ORDER_SELECT)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('orders').update(patch).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['orders'] });
      const prev = qc.getQueryData(['orders']);
      qc.setQueryData(['orders'], old => old?.map(o => o.id === id ? { ...o, ...patch } : o));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['orders'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}
