import { getArrayPayload } from '../utils';

/**
 * Resolves the total row count from a list response payload.
 *
 * The backends answer list endpoints with either an `{ data, meta: { total } }`
 * envelope or a bare `{ data, total }` one. Reading `payload.length` works for
 * neither (the payload is the envelope object, not an array), so the count went
 * undefined/NaN for the bare shape and the empty-state suite skipped its
 * assertion. Handles both envelopes, falling back to the row count.
 */
export function resolveListTotal(payload: unknown): number {
  const envelope = payload as { meta?: { total?: number }; total?: number } | undefined;

  if (typeof envelope?.meta?.total === 'number') return envelope.meta.total;
  if (typeof envelope?.total === 'number') return envelope.total;
  return getArrayPayload(payload).length;
}
