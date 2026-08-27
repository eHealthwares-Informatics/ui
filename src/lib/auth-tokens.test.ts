import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessTokenExpiry,
  persistTokens,
  clearTokens,
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
});