/**
 * Public origin a customer is returned to after paying.
 *
 * `window.location.origin` is correct in production and locally, but a local
 * origin (`http://localhost:5173`) is rejected by the provider WAFs (Monnify's
 * Cloudflare blocks it) — so dev sets `VITE_CALLBACK_URL` to the tunnel origin.
 */
export function publicBaseUrl(): string {
  const configured = import.meta.env.VITE_CALLBACK_URL as string | undefined;
  const origin = configured || (typeof window !== 'undefined' ? window.location.origin : '');
  return origin.replace(/\/$/, '');
}
