import { RXSOFT_API_BASE_URL } from '@/lib/rxsoft-api';

/**
 * Resolve a possibly-relative media URL (e.g. `/uploads/prescriptions/x.jpg`)
 * to a URL reachable from the browser.
 *
 * Uploaded files are stored as `/uploads/...`. In dev the SPA is served by Vite
 * over HTTPS and only `/api` is proxied to the backend, so a bare `/uploads`
 * path falls through to the SPA (module redirect). We therefore serve media
 * under the API base (`/api/uploads/...`), which the existing `/api` proxy
 * forwards — no dedicated media proxy required. The rxsoft backend additionally
 * serves `/api/uploads` from `public/uploads`.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  // Already absolute (http/https), inline data, or a blob URL.
  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }
  // Map the stored `/uploads/...` path onto the API base (`/api/uploads/...`).
  if (url.startsWith('/uploads/')) {
    const base = RXSOFT_API_BASE_URL.replace(/\/+$/, '');
    return `${base}${url}`;
  }
  return url;
}
