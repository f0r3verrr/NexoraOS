/* Админы часто вводят ссылку без протокола ("vk.com") — без нормализации
   <a href="vk.com"> резолвится относительно текущего домена. */
export function normalizeUrl(link) {
  if (!link) return link;
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
}
