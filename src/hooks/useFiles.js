import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { safeFileName } from './useModuleFiles.js';

const BUCKET = 'user-files';

export function useFiles(folder = '') {
  return useQuery({
    queryKey: ['files', folder],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const prefix = `${user.id}${folder ? '/' + folder : ''}`;
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) {
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          return { items: [], bucketMissing: true };
        }
        throw error;
      }
      const items = (data ?? [])
        // _modules — служебная папка личных модулей (сканы авто, чеки, фото), в общих файлах не показываем
        .filter(f => f.name !== '.emptyFolderPlaceholder' && f.name !== '_modules')
        .map(f => ({ ...f, fullPath: `${prefix}/${f.name}` }));
      return { items, bucketMissing: false };
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folder = '' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user.id}/${folder}/${Date.now()}_${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      return path;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (path) => {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function getFileUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useStorageStats() {
  return useQuery({
    queryKey: ['files', 'stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.storage.from(BUCKET).list(user.id, { limit: 1000 });
      if (error) return { total: 0, size: 0 };
      const total = data?.length ?? 0;
      const size = data?.reduce((a, f) => a + (f.metadata?.size ?? 0), 0) ?? 0;
      return { total, size };
    },
  });
}
