import { describe, expect, it } from 'vitest';
import { resolveListTotal } from './list-total';

/**
 * rxsoft-qa#787 — the empty-state suite's count went stale because the shell
 * read `response.data.length`, which is `undefined` for the bare `{data,total}`
 * envelope the PP/IP/POS endpoints return.
 */
describe('resolveListTotal', () => {
  it('reads the meta.total envelope', () => {
    expect(resolveListTotal({ data: [], meta: { total: 0 } })).toBe(0);
    expect(resolveListTotal({ data: [1, 2], meta: { total: 57 } })).toBe(57);
  });

  it('reads the bare { data, total } envelope (PP/IP/POS)', () => {
    expect(resolveListTotal({ data: [], total: 0 })).toBe(0);
    expect(resolveListTotal({ data: [1], total: 3 })).toBe(3);
  });

  it('prefers meta.total when both are present', () => {
    expect(resolveListTotal({ data: [], meta: { total: 5 }, total: 9 })).toBe(5);
  });

  it('falls back to the row count for a bare array', () => {
    expect(resolveListTotal([1, 2, 3])).toBe(3);
    expect(resolveListTotal([])).toBe(0);
  });

  it('falls back to the row count when no total is given', () => {
    expect(resolveListTotal({ data: [1, 2] })).toBe(2);
  });

  it('never returns undefined for an empty or malformed payload', () => {
    expect(resolveListTotal({ data: [] })).toBe(0);
    expect(resolveListTotal({})).toBe(0);
    expect(resolveListTotal(undefined)).toBe(0);
    expect(resolveListTotal(null)).toBe(0);
  });

  it('treats a non-numeric total as absent', () => {
    expect(resolveListTotal({ data: [1], total: 'lots' })).toBe(1);
  });
});
