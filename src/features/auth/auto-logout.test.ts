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

  it('logs out at the shorter of the inactivity window and long token TTLs', () => {
    // A long per-user timeout still respects the inactivity cap.
    const now = 1_000_000_000;
    const expiry = now + 480 * 60 * 1000;
    expect(computeSessionDelay(expiry, now)).toBe(FALLBACK_INACTIVITY_TIMEOUT);
  });

  it('prefers the token expiry when it is shorter than the inactivity window', () => {
    const now = 1_000_000_000;
    const expiry = now + 10 * 60 * 1000;
    expect(computeSessionDelay(expiry, now)).toBe(10 * 60 * 1000);
  });

  it('never schedules a logout sooner than the minimum grace period', () => {
    const now = 1_000_000_000;
    expect(computeSessionDelay(now + 100, now)).toBe(MIN_GRACE_MS);
    expect(computeSessionDelay(now - 5000, now)).toBe(MIN_GRACE_MS);
  });
});