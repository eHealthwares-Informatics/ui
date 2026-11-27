import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getAccessTokenExpiry,
  getRefreshToken,
  getRefreshTokenExpiry,
  getRememberMe,
  persistTokens,
  clearTokens,
  setRememberMe,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_COOKIE_KEY,
} from './auth-tokens';

function makeJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.fake-signature`;
}

/** Same token, but with a `base64url` payload segment (`-`/`_` instead of `+`/`/`). */
function makeBase64UrlJwt(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${payload}.fake-signature`;
}

beforeEach(() => {
  clearTokens();
});

describe('getAccessTokenExpiry', () => {
  it('returns the exp claim converted to epoch milliseconds', () => {
    const exp = Math.floor(Date.now() / 1000) + 900;
    const token = makeJwt({ sub: 'u1', exp });
    expect(getAccessTokenExpiry(token)).toBe(exp * 1000);
  });

  it('returns null when no token is stored', () => {
    expect(getAccessTokenExpiry()).toBeNull();
    expect(getAccessTokenExpiry(null)).toBeNull();
  });

  it('returns null for a corrupt token', () => {
    expect(getAccessTokenExpiry('not-a-jwt')).toBeNull();
    expect(getAccessTokenExpiry('a.b')).toBeNull();
  });

  it('returns null when the token has no exp claim', () => {
    const token = makeJwt({ sub: 'u1' });
    expect(getAccessTokenExpiry(token)).toBeNull();
  });

  it('reads the stored token (no argument) when present', () => {
    const exp = Math.floor(Date.now() / 1000) + 300;
    persistTokens(makeJwt({ exp }), 'rt');
    expect(getAccessTokenExpiry()).toBe(exp * 1000);
  });

  it('decodes a base64url payload segment', () => {
    const exp = Math.floor(Date.now() / 1000) + 600;
    // `exp` + a filler claim long enough that standard base64 produces `+`/`/`.
    const claims = { sub: 'u1', exp, overflow: '\u00ff\u00fe\u00fd'.repeat(8) };
    expect(getAccessTokenExpiry(makeBase64UrlJwt(claims))).toBe(exp * 1000);
  });
});

describe('getRefreshTokenExpiry', () => {
  it('returns the refresh token exp claim in epoch milliseconds', () => {
    const exp = Math.floor(Date.now() / 1000) + 604800;
    const token = makeJwt({ sub: 'u1', exp });
    expect(getRefreshTokenExpiry(token)).toBe(exp * 1000);
  });

  it('reads the stored refresh token when no argument is given', () => {
    const exp = Math.floor(Date.now() / 1000) + 604800;
    persistTokens(makeJwt({ exp }), makeJwt({ sub: 'u1', exp }));
    expect(getRefreshTokenExpiry()).toBe(exp * 1000);
  });

  it('returns null with no stored refresh token', () => {
    clearTokens();
    expect(getRefreshTokenExpiry()).toBeNull();
  });
});

describe('auth-tokens storage', () => {
  it('persists and clears both tokens', () => {
    persistTokens('at-1', 'rt-1');
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-1');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt-1');
    clearTokens();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('defaults "remember me" to true and persists the preference', () => {
    localStorage.clear();
    expect(getRememberMe()).toBe(true);
    setRememberMe(false);
    expect(getRememberMe()).toBe(false);
    expect(localStorage.getItem('rxsoft_admin_remember_me')).toBe('false');
    setRememberMe(true);
    expect(getRememberMe()).toBe(true);
  });

  it('stores tokens in localStorage when remembered (survives restart)', () => {
    persistTokens('at-2', 'rt-2', true);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-2');
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(getAccessToken()).toBe('at-2');
  });

  it('mirrors session-only tokens into localStorage so another tab can auto-login', () => {
    persistTokens('at-3', 'rt-3', false);
    // Shared storage (new tab) + per-tab fallback.
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-3');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt-3');
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-3');
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt-3');
    // The browser-session cookie gates access.
    expect(document.cookie).toContain(`${SESSION_COOKIE_KEY}=1`);
    expect(getAccessToken()).toBe('at-3');
    expect(getRefreshToken()).toBe('rt-3');
  });

  it('discards session-only tokens once the browser session cookie is gone', () => {
    persistTokens('at-4', 'rt-4', false);
    expect(getAccessToken()).toBe('at-4');

    // A new browser session: the session cookie is gone, the leftover
    // localStorage tokens must not resurrect the login.
    document.cookie = `${SESSION_COOKIE_KEY}=; path=/; Max-Age=0`;
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
  });

  it('does not require the session cookie when remembered', () => {
    persistTokens('at-5', 'rt-5', true);
    document.cookie = `${SESSION_COOKIE_KEY}=; path=/; Max-Age=0`;
    expect(getAccessToken()).toBe('at-5');
    expect(getRefreshToken()).toBe('rt-5');
  });

  it('flipping the preference keeps the shared copy and updates the gate', () => {
    persistTokens('at-6', 'rt-6', true);
    expect(document.cookie).not.toContain(`${SESSION_COOKIE_KEY}=1`);

    persistTokens('at-7', 'rt-7', false);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-7');
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-7');
    expect(document.cookie).toContain(`${SESSION_COOKIE_KEY}=1`);

    persistTokens('at-8', 'rt-8', true);
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-8');
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(document.cookie).not.toContain(`${SESSION_COOKIE_KEY}=1`);
  });

  it('clearTokens clears both storages and the session cookie', () => {
    persistTokens('at-9', 'rt-9', false);
    clearTokens();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(document.cookie).not.toContain(`${SESSION_COOKIE_KEY}=1`);
    expect(getAccessToken()).toBeNull();
  });
});
