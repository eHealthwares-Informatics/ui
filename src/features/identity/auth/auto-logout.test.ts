import { describe, it, expect } from 'vitest';
import { computeSessionDelay } from './auto-logout';

const FALLBACK_INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const MIN_GRACE_MS = 15 * 1000;

describe('computeSessionDelay', () => {
  it('returns the fallback inactivity window when there is no token expiry', () => {
    expect(computeSessionDelay(null, 1_000_000_000)).toBe(FALLBACK_INACTIVITY_TIMEOUT);
  });

  it('logs out at token expiry for a fresh 15-minute session', () => {
    const now = 1_000_000_000;
    const expiry = now + 15 * 60 * 1000;
    expect(computeSessionDelay(expiry, now)).toBe(15 * 60 * 1000);
  });

  // The per-user "Login Timeout" in identity is authoritative. Clamping it to a
  // 30-minute inactivity window is what made a long timeout look ignored.
  it('honours a long per-user timeout instead of clamping it to 30 minutes', () => {
    const now = 1_000_000_000;
    const expiry = now + 480 * 60 * 1000;
    expect(computeSessionDelay(expiry, now)).toBe(480 * 60 * 1000);
  });

  it('honours a multi-day session', () => {
    const now = 1_000_000_000;
    const expiry = now + 7 * 24 * 60 * 60 * 1000;
    expect(computeSessionDelay(expiry, now)).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('never schedules a logout sooner than the minimum grace period', () => {
    const now = 1_000_000_000;
    expect(computeSessionDelay(now + 100, now)).toBe(MIN_GRACE_MS);
    expect(computeSessionDelay(now - 5000, now)).toBe(MIN_GRACE_MS);
  });
});
