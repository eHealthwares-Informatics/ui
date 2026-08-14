export const API_BASE_URL = 'http://localhost:8080/api';

const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';

/**
 * Reads the current access token from the admin app's zustand localStorage
 * persistence. Returns null when the user is not authenticated.
 */
export function readAccessToken(page: { evaluate: (fn: () => unknown) => unknown }): Promise<string | null> {
  return page.evaluate(() => window.localStorage.getItem('rxsoft_admin_access_token'));
}

/**
 * Performs an authenticated fetch using the token stored by the admin app.
 * Seeks to stay minimal: plain `fetch`, no axios dependency.
 */
export async function apiFetch<T>(
  page: { evaluate: (fn: () => unknown) => unknown },
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await readAccessToken(page);
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(`apiFetch ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };