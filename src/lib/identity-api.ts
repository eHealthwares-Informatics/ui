import { createAuthApiClient, IDENTITY_API_BASE_URL } from '@/lib/create-api-client';

export { IDENTITY_API_BASE_URL };

export const identityApi = createAuthApiClient({
  baseURL: IDENTITY_API_BASE_URL,
  timeout: 10000,
  enableRefresh: false,
});