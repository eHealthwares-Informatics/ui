export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  phone?: string;
  organizationId: string | null;
  locationId: string | null;
};

export const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
export const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';

export function decodeUserFromAccessToken(accessToken: string): AuthUser | null {
  try {
    const payloadRaw = accessToken.split('.')[1] ?? '';
    const payload = JSON.parse(atob(payloadRaw)) as {
      sub?: string;
      username?: string;
      email?: string;
      roles?: string[];
      phone?: string;
      organizationId?: string;
      locationId?: string | null;
      exp?: number;
    };

    if (!payload.sub || !payload.username) {
      return null;
    }

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles ?? [],
      phone: payload.phone,
      organizationId: payload.organizationId ? payload.organizationId : null,
      locationId: payload.locationId ?? null,
    };
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Returns the access token's absolute expiry timestamp in ms, or null when the
 * token carries no `exp` claim (e.g. missing/corrupt payload).
 */
export function getAccessTokenExpiry(
  accessToken: string | null = getAccessToken(),
): number | null {
  if (!accessToken) {
    return null;
  }
  try {
    const payloadRaw = accessToken.split('.')[1] ?? '';
    const payload = JSON.parse(atob(payloadRaw)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function persistTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
