import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

function isSchemaErr(err) {
  return err && (
    err.code === 'PGRST204' ||
    err.code === 'PGRST205' ||
    err.message?.includes('schema cache') ||
    err.message?.includes('Could not find')
  );
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, goal_type = 'Годовая', horizon, color_token = '--p-openresto', current_value, target_value, progress = 0, notes, category = 'custom', unit }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const base = { user_id: user.id, title, goal_type, horizon, color_token, current_value, target_value, progress, notes };

      // Phase 1: insert base fields (always works)
      const { data, error } = await supabase.from('goals').insert(base).select().single();
      if (error) throw error;

      // Phase 2: try to save category + unit (silent if migration not run)
      if (category !== 'custom' || unit) {
        const ext = {};
        if (category) ext.category = category;
        if (unit)     ext.unit = unit;
        const { error: extErr } = await supabase.from('goals').update(ext).eq('id', data.id);
        if (extErr && !isSchemaErr(extErr)) throw extErr;
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fullPatch }) => {
      // Separate safe fields from potentially-missing columns
      const { category, unit, ...safePatch } = fullPatch;

      // Phase 1: update fields that definitely exist in DB
      if (Object.keys(safePatch).length > 0) {
        const { error } = await supabase.from('goals').update(safePatch).eq('id', id);
        if (error) throw error;
      }

      // Phase 2: update category + unit separately; silently skip if columns missing
      if (category !== undefined) {
        const { error } = await supabase.from('goals').update({ category }).eq('id', id);
        if (error && !isSchemaErr(error)) throw error;
      }
      if (unit !== undefined) {
        const { error } = await supabase.from('goals').update({ unit }).eq('id', id);
        if (error && !isSchemaErr(error)) throw error;
      }
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['goals'] });
      const prev = qc.getQueryData(['goals']);
      qc.setQueryData(['goals'], old => old?.map(g => g.id === id ? { ...g, ...patch } : g));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(['goals'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('goals').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
