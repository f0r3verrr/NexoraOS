import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

/* ─── Профиль (одна строка) ──────────────────────────────── */
export function usePartnerProfile() {
  return useQuery({
    queryKey: ['partner', 'profile'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_profile').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertPartnerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('partner_profile')
        .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner'] }),
  });
}

/* ─── Идеи подарков ──────────────────────────────────────── */
export function useGiftIdeas() {
  return useQuery({
    queryKey: ['partner', 'gifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_ideas').select('*')
        .order('used', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveGiftIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('gift_ideas').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('gift_ideas').insert({ user_id: user.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'gifts'] }),
  });
}

export function useDeleteGiftIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('gift_ideas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'gifts'] }),
  });
}

/* ─── Совместные планы ───────────────────────────────────── */
export function useSharedPlans() {
  return useQuery({
    queryKey: ['partner', 'plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_plans').select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveSharedPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      if (id) {
        const { error } = await supabase.from('shared_plans').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('shared_plans').insert({ user_id: user.id, ...fields });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'plans'] }),
  });
}

export function useDeleteSharedPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('shared_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner', 'plans'] }),
  });
}
