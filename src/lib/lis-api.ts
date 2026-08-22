import { createAuthApiClient } from '@/lib/create-api-client';

export const LIS_API_BASE_URL =
  (import.meta.env.VITE_LIS_API_URL as string | undefined) ?? 'http://localhost:8002';

export const lisApi = createAuthApiClient({
  baseURL: LIS_API_BASE_URL,
  timeout: 15000,
});