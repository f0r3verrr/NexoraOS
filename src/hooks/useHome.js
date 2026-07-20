import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/* Универсальные CRUD-фабрики для простых таблиц модуля «Дом» */
function useList(table, key, order) {
  return useQuery({
    queryKey: ['home', key],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let q = supabase.from(table).select('*').eq('user_id', user.id);
      if (order) q = q.order(order.col, { ascending: order.asc ?? true, nullsFirst: false });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useSave(table, key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from(table).update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from(table).insert({ user_id: user.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home', key] }),
  });
}

function useRemove(table, key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home', key] }),
  });
}

/* Подписки */
export const useSubscriptions      = () => useList('subscriptions', 'subs', { col: 'next_charge', asc: true });
export const useSaveSubscription   = () => useSave('subscriptions', 'subs');
export const useDeleteSubscription = () => useRemove('subscriptions', 'subs');

/* Коммуналка */
export const useUtilityBills      = () => useList('utility_bills', 'utils', { col: 'month', asc: false });
export const useSaveUtilityBill   = () => useSave('utility_bills', 'utils');
export const useDeleteUtilityBill = () => useRemove('utility_bills', 'utils');

/* Сеть и доступы */
export const useHomeAccesses      = () => useList('home_accesses', 'access', { col: 'created_at', asc: true });
export const useSaveHomeAccess    = () => useSave('home_accesses', 'access');
export const useDeleteHomeAccess  = () => useRemove('home_accesses', 'access');

/* Гарантии */
export const useWarranties       = () => useList('warranties', 'warr', { col: 'until', asc: true });
export const useSaveWarranty     = () => useSave('warranties', 'warr');
export const useDeleteWarranty   = () => useRemove('warranties', 'warr');
