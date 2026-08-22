import { createAuthApiClient } from '@/lib/create-api-client';

export const CODING_CONCEPT_API_BASE_URL =
  (import.meta.env.VITE_CODING_CONCEPT_API_URL as string | undefined) ??
  'http://localhost:8004/api/v1';

export const codingConceptApi = createAuthApiClient({
  baseURL: CODING_CONCEPT_API_BASE_URL,
  timeout: 15000,
});

export function codingConceptEndpoint(path = '') {
  return `${CODING_CONCEPT_API_BASE_URL}${path}`;
}