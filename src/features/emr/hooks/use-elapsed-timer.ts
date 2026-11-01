import { useEffect, useState } from 'react';

/** Tolerance for clock skew when deciding whether a start time is "in the future". */
const CLOCK_SKEW_MS = 60_000;

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Resolve the instant an encounter actually started.
 *
 * `encounter_datetime` is a timestamptz, but the record form historically sent
 * a naive `datetime-local` string ("2025-10-30T12:41") that the server parsed in
 * its own UTC zone. For clients east of UTC (e.g. GMT+1) that stored the start
 * one hour in the future, freezing the elapsed counter at 00:00:00. When the
 * primary timestamp is missing, invalid, or still in the future, fall back to
 * the row's `createdAt` (a true DB instant) so the timer keeps counting.
 */
export function resolveStartMs(
  startIso: string | null | undefined,
  fallbackIso: string | null | undefined,
  now: number
): number | null {
  const primary = startIso ? new Date(startIso).getTime() : Number.NaN;
  if (Number.isFinite(primary) && primary <= now + CLOCK_SKEW_MS) {
    return primary;
  }
  const fallback = fallbackIso ? new Date(fallbackIso).getTime() : Number.NaN;
  if (Number.isFinite(fallback) && fallback <= now + CLOCK_SKEW_MS) {
    return fallback;
  }
  return null;
}

/**
 * Counts up from a start timestamp, re-rendering every `tickMs`.
 * Returns the formatted elapsed time plus the raw elapsed milliseconds.
 *
 * `fallbackIso` (usually the record's `createdAt`) is used when the primary
 * start timestamp is missing/invalid/future — see `resolveStartMs`.
 */
export function useElapsedTimer(
  startIso: string | null | undefined,
  tickMs = 1000,
  fallbackIso?: string | null
): { formatted: string; elapsedMs: number; isRunning: boolean } {
  const [now, setNow] = useState(() => Date.now());
  const hasStart = Boolean(startIso || fallbackIso);

  useEffect(() => {
    if (!startIso && !fallbackIso) {
      return;
    }
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(timer);
  }, [startIso, fallbackIso, tickMs]);

  if (!hasStart) {
    return { formatted: '00:00:00', elapsedMs: 0, isRunning: false };
  }

  const startMs = resolveStartMs(startIso, fallbackIso, now);
  if (startMs === null) {
    return { formatted: '00:00:00', elapsedMs: 0, isRunning: false };
  }
  const elapsedMs = Math.max(0, now - startMs);
  return { formatted: formatDuration(elapsedMs), elapsedMs, isRunning: true };
}
