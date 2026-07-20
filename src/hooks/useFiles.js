import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { safeFileName, checkFileSize } from './useModuleFiles.js';

const BUCKET = 'user-files';

export function useFiles(folder = '') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['files', folder],
    queryFn: async () => {
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
      // бакет приватный: доступ только по подписанным ссылкам (1 час)
      const filesOnly = items.filter(f => f.id != null); // у папок id = null, им ссылка не нужна
      if (filesOnly.length) {
        const { data: signed } = await supabase.storage.from(BUCKET)
          .createSignedUrls(filesOnly.map(f => f.fullPath), 3600);
        filesOnly.forEach((f, i) => { f.url = signed?.[i]?.signedUrl ?? null; });
      }
      return { items, bucketMissing: false };
    },
    enabled: !!user,
    refetchInterval: 50 * 60 * 1000,
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, folder = '' }) => {
      checkFileSize(file);
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

export function useStorageStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['files', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list(user.id, { limit: 1000 });
      if (error) return { total: 0, size: 0 };
      const total = data?.length ?? 0;
      const size = data?.reduce((a, f) => a + (f.metadata?.size ?? 0), 0) ?? 0;
      return { total, size };
    },
    enabled: !!user,
  });
}
