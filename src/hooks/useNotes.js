import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useNotes(folder) {
  return useQuery({
    queryKey: ['notes', folder ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('notes')
        .select('*, project:projects(id, name, color_token)')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (folder) q = q.eq('folder', folder);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFolders() {
  return useQuery({
    queryKey: ['notes', 'folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('folder')
        .order('folder');
      if (error) throw error;
      const folders = [...new Set((data ?? []).map(n => n.folder))].filter(Boolean);
      return folders.length ? folders : ['Личное'];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title = 'Без названия', folder = 'Личное', body = '', project_id = null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('notes')
        .insert({ user_id: user.id, title, folder, body, project_id })
        .select('*, project:projects(id, name, color_token)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { error } = await supabase.from('notes').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}
