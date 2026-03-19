const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const MEDIA_BASE = API_BASE.endsWith('/api')
  ? API_BASE.slice(0, -4)
  : API_BASE;

export function toMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
