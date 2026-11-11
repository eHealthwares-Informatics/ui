import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/identity-api', () => ({
  identityApi: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/lib/create-api-client', () => ({
  IDENTITY_API_BASE_URL: 'http://identity.test',
  createAuthApiClient: () => ({ get: vi.fn(), post: vi.fn() }),
  refreshTokenPair: vi.fn(),
}));

import { clearTokens, getAccessToken, getRefreshToken, persistTokens } from '@/lib/auth-tokens';
import { refreshTokenPair } from '@/lib/create-api-client';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from './auth-store';

const jwt = (payload: Record<string, unknown>) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const nowSeconds = () => Math.floor(Date.now() / 1000);
const userPayload = {
  sub: 'u1',
  username: 'admin',
  roles: [],
  permissions: [],
};

describe('useAuthStore.bootstrap refresh', () => {
  beforeEach(() => {
    clearTokens();
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      modules: [],
      permissionMode: 'org',
      loading: false,
      error: null,
      pendingModulesFetch: null,
    });
    vi.mocked(refreshTokenPair).mockReset();
    vi.mocked(identityApi.get).mockReset();
  });

  it('rotates an expired access token instead of destroying the session', async () => {
    persistTokens(jwt({ ...userPayload, exp: nowSeconds() - 60 }), 'refresh-old');
    const nextAccessToken = jwt({ ...userPayload, exp: nowSeconds() + 3600 });
    vi.mocked(refreshTokenPair).mockImplementation(async () => {
      // The real helper persists the rotated pair as part of the exchange.
      persistTokens(nextAccessToken, 'refresh-new');
      return { accessToken: nextAccessToken, refreshToken: 'refresh-new' };
    });
    vi.mocked(identityApi.get).mockResolvedValue({
      data: { modules: [], permissions: [], permissionMode: 'org' },
    } as never);

    await useAuthStore.getState().bootstrap();

    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.id).toBe('u1');
    expect(getAccessToken()).toBe(nextAccessToken);
    expect(getRefreshToken()).toBe('refresh-new');
  });

  it('clears the session when the refresh token is rejected', async () => {
    persistTokens(jwt({ ...userPayload, exp: nowSeconds() - 60 }), 'refresh-bad');
    vi.mocked(refreshTokenPair).mockRejectedValue(new Error('Invalid refresh token'));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().user).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('keeps a valid session without calling refresh', async () => {
    persistTokens(jwt({ ...userPayload, exp: nowSeconds() + 3600 }), 'refresh-ok');

    await useAuthStore.getState().bootstrap();

    expect(refreshTokenPair).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user?.id).toBe('u1');
  });
});
