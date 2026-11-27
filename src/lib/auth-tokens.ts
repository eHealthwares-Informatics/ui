export type AuthUser = {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  phone?: string;
  organizationId: string | null;
  locationId: string | null;
  // Profile claims. Optional so sessions issued before profiles existed still
  // decode — display code falls back to the username (see lib/user-name).
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
};

export const ACCESS_TOKEN_KEY = 'rxsoft_admin_access_token';
export const REFRESH_TOKEN_KEY = 'rxsoft_admin_refresh_token';
/** Where the tokens should live — see `persistTokens` / "Remember me". */
export const REMEMBER_ME_KEY = 'rxsoft_admin_remember_me';
/**
 * Session-only marker. `sessionStorage` is per-tab, so it cannot be used to
 * share a "Remember me off" session with a newly opened tab. A session cookie
 * (no Max-Age) is shared by every tab and cleared when the browser closes,
 * which is exactly the lifetime we need. It carries no secret — only "this
 * browser session owns the tokens in localStorage".
 */
export const SESSION_COOKIE_KEY = 'rxsoft_admin_session';

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined' || !document.cookie) {
    return false;
  }
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .some((part) => part === `${SESSION_COOKIE_KEY}=1`);
}

function writeSessionCookie(remember: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (remember) {
    document.cookie = `${SESSION_COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${SESSION_COOKIE_KEY}=1; path=/; SameSite=Lax`;
}

function removeSessionCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${SESSION_COOKIE_KEY}=; path=/; Max-Age=0; SameSite=Lax`;
}

/**
 * Tokens are always mirrored into `localStorage` so a newly opened tab can
 * pick up the session immediately (the browser storage event is also what
 * live-syncs tabs). With "Remember me" off, a per-browser-session cookie gates
 * access: closing the browser clears the cookie, and the next read discards
 * the leftover tokens. `sessionStorage` is filled too as a per-tab fallback
 * when localStorage is unavailable.
 */
function sessionAllowed(): boolean {
  return getRememberMe() || hasSessionCookie();
}

function readToken(key: string): string | null {
  try {
    const value = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!value) {
      return null;
    }
    if (!sessionAllowed()) {
      // Session-only tokens left over from a previous browser session.
      removeToken(ACCESS_TOKEN_KEY);
      removeToken(REFRESH_TOKEN_KEY);
      removeSessionCookie();
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function writeToken(key: string, value: string, remember: boolean): void {
  try {
    localStorage.setItem(key, value);
    if (remember) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
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

/**
 * Decodes a JWT payload segment. Tokens are `base64url` encoded, while `atob`
 * only understands the standard alphabet — a payload containing `-` or `_`
 * would otherwise throw and make a perfectly valid session look corrupt.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1] ?? '';
    if (!segment) {
      return null;
    }
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function decodeUserFromAccessToken(accessToken: string): AuthUser | null {
  const payload = decodeJwtPayload(accessToken) as {
    sub?: string;
    username?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    phone?: string;
    organizationId?: string;
    locationId?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    exp?: number;
  } | null;

  if (!payload?.sub || !payload.username) {
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
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
    displayName: payload.displayName ?? null,
    dateOfBirth: payload.dateOfBirth ?? null,
    gender: payload.gender ?? null,
  };
}

export function getAccessToken(): string | null {
  return readToken(ACCESS_TOKEN_KEY);
}

/**
 * Returns a token's absolute expiry timestamp in ms, or null when the token
 * carries no `exp` claim (e.g. missing/corrupt payload).
 */
export function getTokenExpiry(token: string | null): number | null {
  if (!token) {
    return null;
  }
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

export function getAccessTokenExpiry(accessToken: string | null = getAccessToken()): number | null {
  return getTokenExpiry(accessToken);
}

export function getRefreshToken(): string | null {
  return readToken(REFRESH_TOKEN_KEY);
}

/**
 * When the refresh token itself expires — the point past which no rotation can
 * keep the session alive.
 */
export function getRefreshTokenExpiry(
  refreshToken: string | null = getRefreshToken()
): number | null {
  return getTokenExpiry(refreshToken);
}

export function persistTokens(
  accessToken: string,
  refreshToken: string,
  remember: boolean = getRememberMe()
): void {
  setRememberMe(remember);
  writeToken(ACCESS_TOKEN_KEY, accessToken, remember);
  writeToken(REFRESH_TOKEN_KEY, refreshToken, remember);
  writeSessionCookie(remember);
}

export function clearTokens(): void {
  removeToken(ACCESS_TOKEN_KEY);
  removeToken(REFRESH_TOKEN_KEY);
  removeSessionCookie();
}
