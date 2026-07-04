import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';

export function useNotes(folder) {
  return useQuery({
    queryKey: ['notes', folder],   // null stays null — no collision with useAllNotes
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

/* All notes without filter — used for correct folder badge counts */
export function useAllNotes() {
  return useQuery({
    queryKey: ['notes', '__counts__'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('id, folder, pinned')
        .order('updated_at', { ascending: false });
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

/* Attachments */
export function useNoteAttachments(noteId) {
  return useQuery({
    queryKey: ['note_attachments', noteId],
    queryFn: async () => {
      if (!noteId) return [];
      const { data, error } = await supabase
        .from('note_attachments')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!noteId,
  });
}

export function useAddAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, file }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/${noteId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('note-attachments')
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from('note_attachments')
        .insert({ note_id: noteId, user_id: user.id, name: file.name, size: file.size, mime_type: file.type, storage_path: path });
      if (dbErr) throw dbErr;
      // Return info needed for inline markdown insertion
      return { storage_path: path, name: file.name, mime_type: file.type };
    },
    onSuccess: (_d, { noteId }) => qc.invalidateQueries({ queryKey: ['note_attachments', noteId] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, noteId, storagePath }) => {
      await supabase.storage.from('note-attachments').remove([storagePath]);
      const { error } = await supabase.from('note_attachments').delete().eq('id', id);
      if (error) throw error;
      return { noteId };
    },
    onSuccess: (_d, { noteId }) => qc.invalidateQueries({ queryKey: ['note_attachments', noteId] }),
  });
}
