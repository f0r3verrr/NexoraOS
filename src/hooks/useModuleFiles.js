import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BUCKET = 'user-files';

/*
 * Подпись файла (любой язык) кодируем в base64url прямо в ключе:
 * {ts}__l_{base64url(label)}.{ext} — все символы безопасны для Storage.
 */
export function encodeLabel(label) {
  const bytes = new TextEncoder().encode(label);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeLabel(fileName) {
  const m = fileName.match(/__l_([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/* Storage не принимает кириллицу/спецсимволы в ключе — оставляем только безопасные */
export function safeFileName(name) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'file';
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
  return ext ? `${base}.${ext}` : base;
}

/*
 * Файлы, привязанные к модулю (сканы документов авто, чеки дома, фото).
 * Живут в user-files/{uid}/_modules/{module}/ — папка _modules скрыта
 * из общего раздела «Файлы».
 */

export function useModuleFiles(module) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['module-files', module],
    queryFn: async () => {
      const prefix = `${user.id}/_modules/${module}`;
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
      if (error) {
        if (error.message?.includes('bucket') || error.message?.includes('not found')) return [];
        throw error;
      }
      const items = (data ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ ...f, fullPath: `${prefix}/${f.name}` }));
      // бакет приватный: доступ к файлам только по подписанным ссылкам (1 час)
      if (items.length) {
        const { data: signed } = await supabase.storage.from(BUCKET)
          .createSignedUrls(items.map(i => i.fullPath), 3600);
        items.forEach((it, i) => { it.url = signed?.[i]?.signedUrl ?? null; });
      }
      return items;
    },
    enabled: !!user,
    // обновляем ссылки до истечения их срока
    refetchInterval: 50 * 60 * 1000,
  });
}

/* Максимальный размер загружаемого файла */
export const MAX_FILE_MB = 20;

export function checkFileSize(file) {
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Файл больше ${MAX_FILE_MB} МБ — сожми или выбери другой`);
  }
}

export function useUploadModuleFile(module) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    // label — необязательная человекочитаемая подпись (кириллица ок)
    mutationFn: async (input) => {
      const { file, label } = input instanceof File ? { file: input, label: null } : input;
      checkFileSize(file);
      const dot = file.name.lastIndexOf('.');
      const ext = dot > 0 ? file.name.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
      const name = label?.trim()
        ? `${Date.now()}__l_${encodeLabel(label.trim())}${ext ? '.' + ext : ''}`
        : `${Date.now()}_${safeFileName(file.name)}`;
      const path = `${user.id}/_modules/${module}/${name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      return path;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-files', module] }),
  });
}

export function useDeleteModuleFile(module) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (path) => {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-files', module] }),
  });
}

export function isImage(name) {
  return /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(name);
}
