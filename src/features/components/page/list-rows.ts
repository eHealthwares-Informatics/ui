/**
 * Helpers for list responses that are not paginated by the backend.
 *
 * Some services (notably the conversation `/channels` endpoint) answer list
 * requests with a bare array and ignore `page`/`limit`. Without a server-side
 * total the page controls would keep re-rendering the full list, so the shell
 * paginates those payloads client-side.
 */

/** True when the payload carries a server-side total and is already paginated. */
export function hasServerTotal(payload: unknown): boolean {
  if (Array.isArray(payload) || payload == null || typeof payload !== 'object') {
    return false;
  }
  const envelope = payload as { meta?: { total?: unknown }; total?: unknown };
  return typeof envelope.meta?.total === 'number' || typeof envelope.total === 'number';
}

/** Slices an already-resolved row list down to the requested page. */
export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(Math.floor(page) || 1, 1);
  const safeSize = Math.max(Math.floor(pageSize) || 1, 1);
  const start = (safePage - 1) * safeSize;
  return rows.slice(start, start + safeSize);
}
