import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';
import { getAccessTokenExpiry, getRefreshToken } from '@/lib/auth-tokens';
import { refreshTokenPair } from '@/lib/create-api-client';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Only used when there is no access token to read a deadline from (e.g. before
 * sign-in). With a token, its `exp` claim — set by the per-user "Login Timeout"
 * in identity — is authoritative; the frontend must not invent a shorter one.
 */
const FALLBACK_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const MIN_GRACE_MS = 15 * 1000;

/**
 * Computes the session timeout delay given the token expiry (epoch ms, or null).
 * The token deadline wins, clamped to a minimum grace period so an already
 * expired token still gets one chance to be refreshed; when no token is present
 * a fixed inactivity window applies.
 */
export function computeSessionDelay(expiry: number | null, now = Date.now()): number {
  if (expiry === null) {
    return FALLBACK_INACTIVITY_TIMEOUT;
  }
  const remaining = expiry - now;
  return Math.max(MIN_GRACE_MS, remaining);
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'mousemove',
  'touchstart',
  'scroll',
  'wheel',
] as const;

export function AutoLogout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const logoutAndRedirect = useCallback(() => {
    const currentPath = window.location.pathname + window.location.search;
    useAuthStore.getState().logout();
    navigate({ to: '/sign-in', search: { redirect: currentPath }, replace: true });
  }, [navigate]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let refreshing = false;

    // Reached when the access token's deadline passes. A valid refresh token
    // means the session is still alive (the configured login timeout can span
    // days), so rotate the pair and re-arm instead of signing the user out —
    // signing out here is what logged people out shortly after the previous
    // short-lived access token expired.
    const onDeadline = async () => {
      if (cancelled || refreshing) {
        return;
      }

      if (getRefreshToken()) {
        refreshing = true;
        try {
          await refreshTokenPair();
          if (!cancelled) {
            schedule();
          }
          return;
        } catch {
          // The refresh token itself is invalid/expired/revoked — the session
          // is genuinely over.
        } finally {
          refreshing = false;
        }
      }

      if (!cancelled) {
        logoutAndRedirect();
      }
    };

    const schedule = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        void onDeadline();
      }, computeSessionDelay(getAccessTokenExpiry()));
    };

    schedule();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, schedule, { passive: true });
    }

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, schedule);
      }
    };
  }, [logoutAndRedirect]);

  return <>{children}</>;
}
