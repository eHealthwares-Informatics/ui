import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const API_BASE_URL = 'http://localhost:8080/api';

const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';

const ADMIN_STORAGE_STATE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.auth',
  'admin.json'
);

/**
 * Fallback: read the admin token from the auth.setup storage-state file.
 * Needed when apiFetch runs before the page has navigated to the app origin
 * (page.evaluate on about:blank throws SecurityError — phase-3 seed steps).
 */
function tokenFromStorageState(): string | null {
  try {
    const state = JSON.parse(readFileSync(ADMIN_STORAGE_STATE, 'utf-8')) as {
      origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
    };
    for (const origin of state.origins ?? []) {
      const entry = origin.localStorage?.find((e) => e.name === ACCESS_TOKEN_KEY);
      if (entry?.value) return entry.value;
    }
  } catch {
    /* storage state missing/unreadable — caller handles null */
  }
  return null;
}

/**
 * Reads the current access token from the admin app's zustand localStorage
 * persistence. Falls back to the auth.setup storage-state file when the page
 * has not visited the app origin yet.
 */
export async function readAccessToken(page: {
  evaluate: (fn: () => unknown) => unknown;
}): Promise<string | null> {
  try {
    return (await page.evaluate(() => window.localStorage.getItem('rxsoft_admin_access_token'))) as
      | string
      | null;
  } catch {
    return tokenFromStorageState();
  }
}

/**
 * Performs an authenticated fetch using the token stored by the admin app.
 * Seeks to stay minimal: plain `fetch`, no axios dependency.
 */
export async function apiFetch<T>(
  page: { evaluate: (fn: () => unknown) => unknown },
  path: string,
  init: RequestInit = {}
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
