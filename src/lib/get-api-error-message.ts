import { AxiosError } from 'axios';

type ApiErrorPayload = {
  error?: { message?: string | string[] } | string;
  message?: string | string[];
  statusCode?: number;
};

function pickPayloadMessage(
  payload: ApiErrorPayload | string | undefined,
): string | undefined {
  if (!payload) return undefined;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed ? trimmed : undefined;
  }
  const candidate =
    typeof payload.error === 'string'
      ? payload.error
      : (payload.error?.message ?? payload.message);
  if (Array.isArray(candidate)) {
    const joined = candidate.filter(Boolean).join(', ').trim();
    return joined || undefined;
  }
  const trimmed = candidate?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Extract a readable, user-appropriate message from any API error:
 * Nest's `{ error: { message } }` and `{ message }` envelopes (strings or
 * class-validator arrays), plain `{ error: "..." }` payloads, axios network
 * failures, and plain Error objects. Always returns a non-empty string.
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'The request timed out. Please check your connection and try again.';
      }
      return 'Cannot reach the server. Check your connection and try again.';
    }
    const payload = error.response.data as ApiErrorPayload | string | undefined;
    const message = pickPayloadMessage(payload);
    if (message) {
      return message;
    }
    if (error.response.status >= 500) {
      return 'The server hit an unexpected error. Please try again.';
    }
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return 'Something went wrong. Please try again.';
}
