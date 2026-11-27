import { Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccessTokenExpiry, getRefreshTokenExpiry } from '@/lib/auth-tokens';
import {
  computeSessionTimeline,
  FALLBACK_SESSION_POLICY,
  fetchSessionPolicy,
  formatMinutes,
  formatSessionMoment,
  type SessionTimeline,
} from '@/lib/session-policy';

/**
 * Session timeline for a user's login timeout. The numbers come from identity
 * (`/auth/session-policy`) so the console explains exactly what the issuer is
 * configured to do — no duplicated TTLs in the frontend.
 */
export function useSessionTimeline(
  loginTimeoutMinutes: number | null | undefined
): SessionTimeline {
  const { data: policy = FALLBACK_SESSION_POLICY } = useQuery({
    queryKey: ['identity', 'session-policy'],
    queryFn: fetchSessionPolicy,
    // Token lifetimes only change with an identity restart.
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  // Freeze `now` per (user setting, policy) pair so the rendered instants do
  // not drift by milliseconds on every re-render.
  return useMemo(
    () => computeSessionTimeline(loginTimeoutMinutes, policy),
    [loginTimeoutMinutes, policy]
  );
}

function normalizeMinutes(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const minutes = Number(value);
  return Number.isFinite(minutes) ? minutes : null;
}

/**
 * The two lines. Split out so both sources — a configured login timeout and the
 * live tokens — render identically.
 */
export function SessionLines({
  logoutAt,
  refreshAt,
  note,
  testIdPrefix,
}: {
  logoutAt: Date | null;
  refreshAt: Date | null;
  note?: string;
  testIdPrefix: string;
}) {
  return (
    <Stack gap={4} data-testid={`${testIdPrefix}-timeline`}>
      <Text size="sm">
        <Text span fw={600}>
          You will be auto logged out at{' '}
        </Text>
        <span data-testid={`${testIdPrefix}-auto-logout-at`}>
          {logoutAt ? formatSessionMoment(logoutAt) : '—'}
        </span>
      </Text>
      <Text size="sm">
        <Text span fw={600}>
          Your session will be auto refreshed at{' '}
        </Text>
        <span data-testid={`${testIdPrefix}-auto-refresh-at`}>
          {refreshAt ? formatSessionMoment(refreshAt) : '—'}
        </span>
      </Text>
      {note && (
        <Text size="xs" c="dimmed">
          {note}
        </Text>
      )}
    </Stack>
  );
}

/** One formatted instant — used where the label is supplied by the caller. */
export function SessionTimelineLine({
  loginTimeoutMinutes,
  kind,
  testId,
}: {
  loginTimeoutMinutes: number | string | null | undefined;
  kind: 'logout' | 'refresh';
  testId?: string;
}) {
  const timeline = useSessionTimeline(normalizeMinutes(loginTimeoutMinutes));
  const at = kind === 'logout' ? timeline.logoutAt : timeline.refreshAt;
  return <span data-testid={testId}>{formatSessionMoment(at)}</span>;
}

/**
 * The two lines for a configured login timeout: when the session expires, and
 * when it is renewed before that.
 */
export function SessionTimeline({
  loginTimeoutMinutes,
  testIdPrefix = 'session',
}: {
  loginTimeoutMinutes: number | string | null | undefined;
  testIdPrefix?: string;
}) {
  const timeline = useSessionTimeline(normalizeMinutes(loginTimeoutMinutes));

  return (
    <SessionLines
      logoutAt={timeline.logoutAt}
      refreshAt={timeline.refreshAt}
      testIdPrefix={testIdPrefix}
      note={`Session length ${formatMinutes(timeline.accessMinutes)}.${
        timeline.capped
          ? ` Your setting exceeds the system maximum and is capped at ${formatMinutes(
              timeline.accessMinutes
            )}.`
          : ''
      } The token pair is rotated silently at that instant; the session only ends when the refresh token expires.`}
    />
  );
}

function readTokenExpiries(): { access: number | null; refresh: number | null } {
  return { access: getAccessTokenExpiry(), refresh: getRefreshTokenExpiry() };
}

/**
 * Expiries of the tokens this browser actually holds. They move forward
 * whenever the pair is rotated, so re-read on focus, on another tab's
 * login/refresh (`storage`), and on a slow tick for silent rotations.
 */
function useLiveTokenExpiries(): { access: number | null; refresh: number | null } {
  const [expiries, setExpiries] = useState(readTokenExpiries);
  const sync = useCallback(() => setExpiries(readTokenExpiries()), []);

  useEffect(() => {
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    const timer = window.setInterval(sync, 60_000);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      window.clearInterval(timer);
    };
  }, [sync]);

  return expiries;
}

/**
 * The current session as it stands: the refresh token's expiry is the hard end
 * (sign-out), the access token's expiry is when the pair is rotated.
 */
export function CurrentSessionTimeline({
  testIdPrefix = 'account-session',
}: {
  testIdPrefix?: string;
}) {
  const { access, refresh } = useLiveTokenExpiries();

  return (
    <SessionLines
      logoutAt={refresh ? new Date(refresh) : null}
      refreshAt={access ? new Date(access) : null}
      testIdPrefix={testIdPrefix}
      note="These times come from the tokens this browser currently holds. The pair is rotated silently when the access token expires, so the session only ends when the refresh token does."
    />
  );
}
