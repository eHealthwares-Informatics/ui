import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getAccessTokenExpiry,
  getRefreshToken,
  getRememberMe,
  persistTokens,
  clearTokens,
  setRememberMe,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from './auth-tokens';

function makeJwt(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify(claims));
  return `${header}.${payload}.fake-signature`;
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

  it('stores tokens in sessionStorage when not remembered (session-only)', () => {
    persistTokens('at-3', 'rt-3', false);
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-3');
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rt-3');
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    // Reads find the token whichever storage holds it.
    expect(getAccessToken()).toBe('at-3');
    expect(getRefreshToken()).toBe('rt-3');
  });

  it('moves tokens between storages when the preference flips', () => {
    persistTokens('at-4', 'rt-4', true);
    persistTokens('at-5', 'rt-5', false);
    // The remembered copy is removed so a stale persistent token can't linger.
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe('at-5');
  });

  it('clearTokens clears both storages', () => {
    persistTokens('at-6', 'rt-6', true);
    persistTokens('at-6', 'rt-6', false);
    clearTokens();
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
