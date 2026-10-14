import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { shouldRetryQuery } from './query-retry';

/**
 * rxsoft-qa#780 — a mocked 500 on a list endpoint never surfaced `DataTable`'s
 * error state inside a normal timeout. The old policy allowed 4 retries, and
 * React Query's default backoff (1s + 2s + 4s + 8s) pushed the error ~15s out.
 */
function httpError(status: number): AxiosError {
  const error = new AxiosError('boom');
  error.response = {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { message: 'boom' },
  };
  return error;
}

describe('shouldRetryQuery', () => {
  it('does not retry a 500 — the error state must surface immediately', () => {
    expect(shouldRetryQuery(0, httpError(500))).toBe(false);
  });

  it('does not retry any HTTP error (4xx or 5xx)', () => {
    for (const status of [400, 401, 403, 404, 422, 500, 502, 503]) {
      expect(shouldRetryQuery(0, httpError(status))).toBe(false);
    }
  });

  it('retries a network failure (no response) twice, then gives up', () => {
    const networkError = new AxiosError('Network Error');
    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(1, networkError)).toBe(true);
    expect(shouldRetryQuery(2, networkError)).toBe(false);
  });

  it('does not retry an unknown error indefinitely', () => {
    expect(shouldRetryQuery(0, new Error('nope'))).toBe(true);
    expect(shouldRetryQuery(2, new Error('nope'))).toBe(false);
  });
});
