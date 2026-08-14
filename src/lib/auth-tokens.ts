export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  phone?: string;
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
    };
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
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
