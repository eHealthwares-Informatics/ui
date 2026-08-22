import { createAuthApiClient } from '@/lib/create-api-client';

export const COMMUNICATION_API_BASE_URL =
  (import.meta.env.VITE_COMMUNICATION_API_URL as string | undefined) ??
  'http://localhost:8003/api/v1';

/** @deprecated Use COMMUNICATION_API_BASE_URL instead */
export const API_BASE_URL = COMMUNICATION_API_BASE_URL;

export const communicationApi = createAuthApiClient({
  baseURL: COMMUNICATION_API_BASE_URL,
  timeout: 15000,
});