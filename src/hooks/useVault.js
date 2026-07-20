import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

/* ─── Notes ──────────────────────────────────────────────── */

export function useVaultNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vault_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateVaultNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title = '', content = '' } = {}) => {
      const { data, error } = await supabase
        .from('vault_notes')
        .insert({ user_id: user.id, title, content })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_notes'] }),
  });
}

export function useUpdateVaultNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('vault_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_notes'] }),
  });
}

export function useDeleteVaultNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('vault_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_notes'] }),
  });
}

/* ─── Credentials ────────────────────────────────────────── */

export function useVaultCreds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vault_creds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateVaultCred() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (cred = {}) => {
      const { data, error } = await supabase
        .from('vault_credentials')
        .insert({ user_id: user.id, title: '', url: '', login: '', password: '', notes: '', ...cred })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_creds'] }),
  });
}

export function useUpdateVaultCred() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('vault_credentials')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_creds'] }),
  });
}

export function useDeleteVaultCred() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('vault_credentials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault_creds'] }),
  });
}
