import type { Page } from '@playwright/test';
import { adminCredentials } from '../fixtures/data';

/** Identity service origin (login/refresh provider). */
export const IDENTITY_BASE_URL = 'http://localhost:8092';

export const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
export const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';
export const STORE_KEY = 'rxsoft-admin-auth';

type JwtPayload = {
  sub?: string;
  username?: string;
  email?: string;
  phone?: string;
  organizationId?: string | null;
  locationId?: string | null;
  roles?: string[];
};

function decodePayload(token: string): JwtPayload | null {
  try {
    const part = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const b64 = part.padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as JwtPayload;
  } catch {
    return null;
  }
}

type SessionSeed = { accessToken: string; refreshToken: string; storeJson: string; exp: number };

/**
 * Worker-cached session seed: login once per Playwright worker (module state is
 * per worker) and reuse it for every test in that worker via a cheap
 * `addInitScript`. Cuts the identity login round-trip from N tests to 1.
 * The seed is re-logged-in once it approaches expiry so long-lived workers
 * never inject an expired access token (which bounces apps to /sign-in).
 */
let cachedSeed: Promise<SessionSeed> | null = null;

async function loginSeed(): Promise<SessionSeed> {
  const creds = adminCredentials();
  const res = await fetch(`${IDENTITY_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const pair = (await res.json()) as { accessToken: string; refreshToken: string };
  const payload = decodePayload(pair.accessToken);
  const exp = payload?.exp ?? 0;
  const user =
    payload?.sub && payload.username
      ? {
          id: payload.sub,
          username: payload.username,
          email: payload.email,
          roles: payload.roles ?? [],
          phone: payload.phone,
          organizationId: payload.organizationId ?? null,
          locationId: payload.locationId ?? null,
        }
      : undefined;

  const storeJson = JSON.stringify({
    state: {
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      user,
      modules: [],
      loading: false,
      error: null,
      pendingModulesFetch: null,
    },
    version: 0,
  });

  return { accessToken: pair.accessToken, refreshToken: pair.refreshToken, storeJson, exp };
}

/** Returns a fresh-enough seed, re-logging-in when the cached one is near expiry. */
async function sessionSeed(): Promise<SessionSeed> {
  cachedSeed ??= loginSeed();
  let seed = await cachedSeed;
  const now = Math.floor(Date.now() / 1000);
  if (seed.exp > 0 && seed.exp - now < 120) {
    cachedSeed = loginSeed();
    seed = await cachedSeed;
  }
  return seed;
}

/**
 * Primes the admin session for an authenticated context.
 *
 * Playwright's `storageState` is written once during `auth.setup`, but the
 * identity access token is short-lived (default ~8-15 min) and its refresh
 * token rotates on every login, so suites would be bounced back to /sign-in
 * mid-run. For every authenticated context this injects a session (logged in
 * once per worker via `cachedSeed`) via `addInitScript` so the app boots
 * already signed in.
 *
 * Non-authenticated and synthetic (mocked EMR) contexts are left untouched.
 */
export async function primeAdminSession(page: Page): Promise<void> {
  try {
    const state = await page.context().storageState();
    const origin = (state.origins ?? []).find((o) => o.origin.includes('localhost:5173'));
    const ls: Array<{ name: string; value: string }> = origin?.localStorage ?? [];

    // Only authenticated contexts carry the access token; public/synthetic
    // (mocked EMR) contexts are left alone.
    const hasToken = ls.some((item) => item.name === ACCESS_TOKEN_KEY);
    if (!hasToken) return;

    const storedStore = ls.find((item) => item.name === STORE_KEY)?.value;
    let modules: unknown[] = [];
    if (storedStore) {
      try {
        modules = JSON.parse(storedStore).state?.modules ?? [];
      } catch {
        /* ignore malformed store */
      }
    }

    const seed = await sessionSeed();

    const store = JSON.stringify({
      state: {
        accessToken: seed.accessToken,
        refreshToken: seed.refreshToken,
        user: JSON.parse(seed.storeJson).state.user,
        modules,
        loading: false,
        error: null,
        pendingModulesFetch: null,
      },
      version: 0,
    });

    await page.addInitScript(
      ({ accessToken, refreshToken, storeJson }) => {
        window.localStorage.setItem('rxsoft_admin_access_token', accessToken);
        window.localStorage.setItem('rxsoft_admin_refresh_token', refreshToken);
        window.localStorage.setItem('rxsoft-admin-auth', storeJson);
      },
      { accessToken: seed.accessToken, refreshToken: seed.refreshToken, storeJson: store },
    );
  } catch {
    // Never let a priming failure hard-fail a test — fall back to whatever
    // storageState provided (auth specs re-login through the UI on their own).
  }
}

export function decodeUserFromAccessToken(token: string): {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  phone?: string;
  organizationId: string | null;
  locationId: string | null;
} | null {
  const payload = decodePayload(token);
  if (!payload?.sub || !payload.username) return null;
  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email,
    roles: payload.roles ?? [],
    phone: payload.phone,
    organizationId: payload.organizationId ?? null,
    locationId: payload.locationId ?? null,
  };
}