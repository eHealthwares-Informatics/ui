import { describe, expect, it } from 'vitest';
import {
  computeSessionTimeline,
  FALLBACK_SESSION_POLICY,
  formatMinutes,
  resolveAccessMinutes,
  type SessionPolicy,
} from './session-policy';

const POLICY: SessionPolicy = {
  defaultAccessTokenMinutes: 15,
  maxAccessTokenMinutes: 10080,
  refreshTokenMinutes: 10080,
};

describe('resolveAccessMinutes', () => {
  it('falls back to the system default when the user has no timeout', () => {
    expect(resolveAccessMinutes(null, POLICY)).toBe(15);
    expect(resolveAccessMinutes(undefined, POLICY)).toBe(15);
    expect(resolveAccessMinutes(0, POLICY)).toBe(15);
  });

  it('uses the per-user timeout when it is within the maximum', () => {
    expect(resolveAccessMinutes(480, POLICY)).toBe(480);
  });

  it('caps the per-user timeout at the system maximum', () => {
    expect(resolveAccessMinutes(18000, POLICY)).toBe(10080);
  });
});

describe('computeSessionTimeline', () => {
  const now = Date.UTC(2026, 0, 1, 12, 0, 0);

  it('refreshes at access-token expiry and logs out at refresh-token expiry', () => {
    const timeline = computeSessionTimeline(480, POLICY, now);

    expect(timeline.accessMinutes).toBe(480);
    expect(timeline.refreshAt.getTime() - now).toBe(480 * 60_000);
    expect(timeline.logoutAt.getTime() - now).toBe(10080 * 60_000);
    expect(timeline.capped).toBe(false);
  });

  it('flags a setting that was capped by the system maximum', () => {
    const timeline = computeSessionTimeline(18000, POLICY, now);

    expect(timeline.accessMinutes).toBe(10080);
    expect(timeline.capped).toBe(true);
  });

  it('defaults to the fallback policy when none is supplied', () => {
    const timeline = computeSessionTimeline(null, undefined, now);
    expect(timeline.accessMinutes).toBe(FALLBACK_SESSION_POLICY.defaultAccessTokenMinutes);
  });
});

describe('formatMinutes', () => {
  it('renders days, hours and minutes', () => {
    expect(formatMinutes(10080)).toBe('7 days');
    expect(formatMinutes(1440)).toBe('1 day');
    expect(formatMinutes(1500)).toBe('1 day');
    expect(formatMinutes(750)).toBe('12 h 30 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(45)).toBe('45 min');
  });
});
