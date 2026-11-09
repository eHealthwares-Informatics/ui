import { describe, expect, it } from 'vitest';
import { buildRxsoftListParams } from './build-list-params';

describe('buildRxsoftListParams', () => {
  it('passes through when there is nothing beyond page + limit', () => {
    const params = { page: 1, limit: 10 };
    expect(buildRxsoftListParams(params)).toBe(params);
  });

  it('sends a free-text search as a PLAIN string', () => {
    const result = buildRxsoftListParams({
      page: 1,
      limit: 10,
      search: 'amoxicillin',
    });
    expect(result.search).toBe('amoxicillin');
  });

  it('keeps the free text plain even when a column filter is present (rxsoft-qa#787)', () => {
    const result = buildRxsoftListParams({
      page: 1,
      limit: 10,
      search: 'zz-no-match',
      status: 'EQUALS|ACTIVE',
    });
    // Regression: this used to be `{"search":"zz-no-match","status":"EQUALS|ACTIVE"}`,
    // which the backend parsed as a column DSL → the search no-opped and the list
    // returned every row.
    expect(result.search).toBe('zz-no-match');
  });

  it('keeps the free text plain even when the superadmin org param is present', () => {
    const result = buildRxsoftListParams({
      page: 1,
      limit: 10,
      search: 'zz-no-match',
      organizationId: 'org-1',
    });
    expect(result.search).toBe('zz-no-match');
  });

  it('JSON-encodes column filters when there is no free text', () => {
    const result = buildRxsoftListParams({
      page: 1,
      limit: 10,
      status: 'EQUALS|ACTIVE',
    });
    expect(result.search).toBe(JSON.stringify({ status: 'EQUALS|ACTIVE' }));
  });

  it('sends an empty search when there is neither text nor filters', () => {
    const result = buildRxsoftListParams({ page: 1, limit: 10, sortBy: 'name' });
    expect(result.search).toBe('');
  });

  it('treats a whitespace-only search as empty', () => {
    const result = buildRxsoftListParams({
      page: 1,
      limit: 10,
      search: '   ',
    });
    expect(result.search).toBe('');
  });

  it('re-emits listParams as real params and never folds them into search', () => {
    const result = buildRxsoftListParams(
      { page: 1, limit: 10, search: 'abc', batchId: 'b-1' },
      { listParams: { batchId: 'b-1' } }
    );
    expect(result.batchId).toBe('b-1');
    expect(result.search).toBe('abc');
  });

  it('passes sortBy/sortOrder through and defaults order to desc', () => {
    const result = buildRxsoftListParams({
      page: 2,
      limit: 25,
      sortBy: 'createdAt',
      search: 'abc',
    });
    expect(result).toMatchObject({
      page: 2,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('does not mutate the caller query params', () => {
    const input = {
      page: 1,
      limit: 10,
      search: 'abc',
      organizationId: 'org-1',
    };
    buildRxsoftListParams(input);
    expect(input).toEqual({
      page: 1,
      limit: 10,
      search: 'abc',
      organizationId: 'org-1',
    });
  });
});
