import { AxiosError } from 'axios';

type ApiErrorPayload = {
  error?: { message?: string | string[] };
  message?: string | string[];
};

/** Extract a readable message from the EMR API error envelope. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    const message = payload?.error?.message ?? payload?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (message) {
      return message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}
