import { describe, expect, it } from 'vitest';
import { hasServerTotal, paginateRows } from './list-rows';

describe('hasServerTotal', () => {
  it('detects meta.total envelopes', () => {
    expect(hasServerTotal({ data: [], meta: { total: 0 } })).toBe(true);
  });

  it('detects bare { data, total } envelopes', () => {
    expect(hasServerTotal({ data: [], total: 3 })).toBe(true);
  });

  it('treats bare arrays as unpaginated', () => {
    expect(hasServerTotal([])).toBe(false);
    expect(hasServerTotal([{ id: 1 }])).toBe(false);
  });

  it('treats envelopes without a numeric total as unpaginated', () => {
    expect(hasServerTotal({ data: [1] })).toBe(false);
    expect(hasServerTotal({ data: [1], total: 'lots' })).toBe(false);
    expect(hasServerTotal(null)).toBe(false);
    expect(hasServerTotal(undefined)).toBe(false);
  });
});

describe('paginateRows', () => {
  const rows = Array.from({ length: 15 }, (_, i) => i + 1);

  it('returns the requested page slice', () => {
    expect(paginateRows(rows, 1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginateRows(rows, 2, 5)).toEqual([6, 7, 8, 9, 10]);
    expect(paginateRows(rows, 3, 5)).toEqual([11, 12, 13, 14, 15]);
  });

  it('returns a short final page and an empty page past the end', () => {
    expect(paginateRows(rows, 3, 6)).toEqual([13, 14, 15]);
    expect(paginateRows(rows, 4, 6)).toEqual([]);
  });

  it('honours page-size changes', () => {
    expect(paginateRows(rows, 1, 25)).toHaveLength(15);
    expect(paginateRows(rows, 1, 10)).toEqual(rows.slice(0, 10));
  });

  it('clamps invalid page/pageSize values', () => {
    expect(paginateRows(rows, 0, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginateRows(rows, -2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginateRows(rows, 1, 0)).toEqual([1]);
  });
});
