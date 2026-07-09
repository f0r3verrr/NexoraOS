import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useKanbanColumns() {
  return useQuery({
    queryKey: ['kanban_columns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateKanbanColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, color_token = '--text-muted', position = 99 }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('kanban_columns')
        .insert({ user_id: user.id, title, color_token, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_columns'] }),
  });
}

export function useUpdateKanbanColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('kanban_columns').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kanban_columns'] }),
  });
}

export function useDeleteKanbanColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      // Move orphaned tasks to backlog before deleting
      await supabase.from('tasks').update({ kanban_status: 'backlog' }).eq('kanban_status', id);
      const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban_columns'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
