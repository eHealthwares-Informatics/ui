import { createAuthApiClient } from '@/lib/create-api-client';

export const EMR_API_BASE_URL =
  (import.meta.env.VITE_EMR_API_URL as string | undefined) ?? 'http://localhost:8093/api';

export const emrApi = createAuthApiClient({
  baseURL: EMR_API_BASE_URL,
  timeout: 15000,
});