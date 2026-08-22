import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessTokenExpiry } from '@/lib/auth-tokens';

const FALLBACK_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const MIN_GRACE_MS = 15 * 1000;

/**
 * Computes the session timeout delay given the token expiry (epoch ms, or null).
 * The token deadline wins but is clamped to a minimum grace period; when no
 * token is present a fixed inactivity window applies.
 */
export function computeSessionDelay(
  expiry: number | null,
  now = Date.now(),
): number {
  if (expiry === null) {
    return FALLBACK_INACTIVITY_TIMEOUT;
  }
  const remaining = expiry - now;
  return Math.max(MIN_GRACE_MS, Math.min(FALLBACK_INACTIVITY_TIMEOUT, remaining));
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoutAndRedirect = useCallback(() => {
    const currentPath = window.location.href;
    useAuthStore.getState().logout();
    navigate({ to: '/sign-in', search: { redirect: currentPath }, replace: true });
  }, [navigate]);

  // Session deadline comes from the access token's `exp` claim (set by the
  // per-user timeout in identity), falling back to a fixed inactivity window
  // when no token is present yet.
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const expiry = getAccessTokenExpiry();
    if (expiry === null) {
      timerRef.current = setTimeout(logoutAndRedirect, FALLBACK_INACTIVITY_TIMEOUT);
      return;
    }

    timerRef.current = setTimeout(logoutAndRedirect, computeSessionDelay(expiry, Date.now()));
  }, [logoutAndRedirect]);

  useEffect(() => {
    resetTimer();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [resetTimer]);

  return <>{children}</>;
}