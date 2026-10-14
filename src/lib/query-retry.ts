import { AxiosError } from 'axios';

/**
 * Whether a failed list query should be retried.
 *
 * Only failures that might genuinely be transient are worth retrying — a
 * network blip, where the request never got an answer. An **HTTP** error is the
 * server telling us something concrete (a 500 is a 500 in a second too), and
 * retrying it only buries the error state behind backoff.
 *
 * That was the bug behind rxsoft-qa#780: a mocked 500 on a list endpoint never
 * surfaced `DataTable`'s "Failed to load data" inside a normal timeout, because
 * the retry policy allowed 4 retries and React Query's default backoff
 * (1s + 2s + 4s + 8s) put the error state ~15s out. It read as a *silent* error
 * gap; it was a retry policy that delayed the honest one.
 *
 * 4xx and 5xx are both terminal. Auth errors (401/403) were already excluded;
 * this makes the rule uniform and immediate.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof AxiosError && error.response) {
    return false;
  }

  // No response → assume transient; retry twice, then give up.
  return failureCount < 2;
}
