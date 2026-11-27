import dayjs from 'dayjs';
import { identityApi } from '@/lib/identity-api';

/**
 * Token lifetimes published by identity (`GET /auth/session-policy`). They are
 * read from the identity env (`ACCESS_TOKEN_TTL_MINUTES`,
 * `ACCESS_TOKEN_TTL_MAX_MINUTES`) instead of being duplicated here, so the
 * session timeline shown in the console can never drift from the tokens that
 * are actually issued.
 */
export type SessionPolicy = {
  defaultAccessTokenMinutes: number;
  maxAccessTokenMinutes: number;
  refreshTokenMinutes: number;
};

/**
 * Mirrors identity's defaults, used only while the request is in flight or when
 * identity is unreachable (the timeline then falls back to standard numbers
 * instead of rendering nothing).
 */
export const FALLBACK_SESSION_POLICY: SessionPolicy = {
  defaultAccessTokenMinutes: 15,
  maxAccessTokenMinutes: 10080,
  refreshTokenMinutes: 10080,
};

export async function fetchSessionPolicy(): Promise<SessionPolicy> {
  const { data } = await identityApi.get<SessionPolicy>('/auth/session-policy');
  return data;
}

export type SessionTimeline = {
  /** Access-token lifetime actually applied, after the system maximum. */
  accessMinutes: number;
  /** When the console rotates the token pair (access-token expiry). */
  refreshAt: Date;
  /** When the refresh token expires — the hard end of the session. */
  logoutAt: Date;
  /** The user's setting was larger than the system maximum and got capped. */
  capped: boolean;
};

/**
 * The access lifetime identity will issue for a user:
 * `min(loginTimeoutMinutes ?? default, maxAccessTokenMinutes)`.
 */
export function resolveAccessMinutes(
  loginTimeoutMinutes: number | null | undefined,
  policy: SessionPolicy = FALLBACK_SESSION_POLICY
): number {
  const requested = Number(loginTimeoutMinutes);
  const requestedValid = Number.isFinite(requested) && requested > 0;
  const base = requestedValid ? requested : policy.defaultAccessTokenMinutes;
  return Math.min(Math.max(1, base), policy.maxAccessTokenMinutes);
}

/**
 * Two distinct instants:
 *  - `refreshAt` — the access token expires and the console silently rotates
 *    the pair (or an earlier 401 triggers the same rotation).
 *  - `logoutAt` — the refresh token itself expires; nothing can renew the
 *    session after this, so the user is signed out.
 */
export function computeSessionTimeline(
  loginTimeoutMinutes: number | null | undefined,
  policy: SessionPolicy = FALLBACK_SESSION_POLICY,
  now: number = Date.now()
): SessionTimeline {
  const accessMinutes = resolveAccessMinutes(loginTimeoutMinutes, policy);
  const requested = Number(loginTimeoutMinutes);
  return {
    accessMinutes,
    refreshAt: new Date(now + accessMinutes * 60_000),
    logoutAt: new Date(now + policy.refreshTokenMinutes * 60_000),
    capped: Number.isFinite(requested) && requested > policy.maxAccessTokenMinutes,
  };
}

/** Local-time, unambiguous ("Sat, 1 Dec 2026, 14:35"). */
export function formatSessionMoment(moment: Date): string {
  return dayjs(moment).format('ddd, D MMM YYYY, HH:mm');
}

/** "7 days", "12 h 30 min", "45 min". */
export function formatMinutes(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.round((minutes / 1440) * 10) / 10;
    const label = Number.isInteger(days) ? String(days) : days.toFixed(1);
    return `${label} day${days === 1 ? '' : 's'}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }
  return `${minutes} min`;
}
