import { supabase } from './supabase.js';

const BUCKET = 'feedback-attachments';
export const MAX_FILES = 4;
export const MAX_SIZE = 50 * 1024 * 1024; // соответствует file_size_limit бакета

export function isImage(mime) { return mime?.startsWith('image/'); }
export function isVideo(mime) { return mime?.startsWith('video/'); }

/* Путь = {владелец_тикета}/{тикет}/{файл} — так и владелец, и админ (через
   is_admin() в RLS) читают одни и те же вложения независимо от того, кто
   из них их загрузил. */
export async function uploadFeedbackFiles(files, ownerId, ticketId) {
  const results = [];
  for (const file of files) {
    if (file.size > MAX_SIZE) throw new Error(`Файл "${file.name}" больше 50 МБ`);
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const path = `${ownerId}/${ticketId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    results.push({ path, name: file.name, mime: file.type, size: file.size });
  }
  return results;
}

export async function feedbackSignedUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
