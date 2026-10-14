export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  phone?: string;
  organizationId: string | null;
  locationId: string | null;
};

export const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
export const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';
/** Where the tokens should live — see `persistTokens` / "Remember me". */
export const REMEMBER_ME_KEY = 'rxsoft_admin_remember_me';

/**
 * "Remember me" storage policy: tokens live in `localStorage` when on (they
 * survive a browser restart) and `sessionStorage` when off (cleared when the
 * tab closes). Reads check BOTH storages so flipping the preference mid-session
 * never orphans an already-issued token.
 */
function readToken(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string, remember: boolean): void {
  try {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(key);
    target.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / quota) — best effort */
  }
}

function removeToken(key: string): void {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * The user's remembered preference. Defaults to `true` so behaviour is
 * unchanged for anyone who never touches the checkbox (persistent login).
 */
export function getRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setRememberMe(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function decodeUserFromAccessToken(accessToken: string): AuthUser | null {
  try {
    const payloadRaw = accessToken.split('.')[1] ?? '';
    const payload = JSON.parse(atob(payloadRaw)) as {
      sub?: string;
      username?: string;
      email?: string;
      roles?: string[];
      permissions?: string[];
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
      permissions: payload.permissions ?? [],
      phone: payload.phone,
      organizationId: payload.organizationId ? payload.organizationId : null,
      locationId: payload.locationId ?? null,
    };
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return readToken(ACCESS_TOKEN_KEY);
}

/**
 * Returns the access token's absolute expiry timestamp in ms, or null when the
 * token carries no `exp` claim (e.g. missing/corrupt payload).
 */
export function getAccessTokenExpiry(accessToken: string | null = getAccessToken()): number | null {
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
  return readToken(REFRESH_TOKEN_KEY);
}

export function persistTokens(
  accessToken: string,
  refreshToken: string,
  remember: boolean = getRememberMe()
): void {
  setRememberMe(remember);
  writeToken(ACCESS_TOKEN_KEY, accessToken, remember);
  writeToken(REFRESH_TOKEN_KEY, refreshToken, remember);
}

export function clearTokens(): void {
  removeToken(ACCESS_TOKEN_KEY);
  removeToken(REFRESH_TOKEN_KEY);
}
