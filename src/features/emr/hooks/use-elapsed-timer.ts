import { useEffect, useState } from 'react';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Counts up from a start timestamp, re-rendering every `tickMs`.
 * Returns the formatted elapsed time plus the raw elapsed milliseconds.
 */
export function useElapsedTimer(
  startIso: string | null | undefined,
  tickMs = 1000,
): { formatted: string; elapsedMs: number; isRunning: boolean } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startIso) {
      return;
    }
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(timer);
  }, [startIso, tickMs]);

  if (!startIso) {
    return { formatted: '00:00:00', elapsedMs: 0, isRunning: false };
  }

  const startMs = new Date(startIso).getTime();
  const elapsedMs = Number.isNaN(startMs) ? 0 : Math.max(0, now - startMs);
  return { formatted: formatDuration(elapsedMs), elapsedMs, isRunning: true };
}
