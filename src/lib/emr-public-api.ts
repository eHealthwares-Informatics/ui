import axios from 'axios';

export const EMR_PUBLIC_API_BASE_URL =
  (import.meta.env.VITE_EMR_API_URL as string | undefined) ?? '/api/emr';

/**
 * Public EMR client. No auth interceptors and no 401 redirect — used by the
 * unauthenticated form-fill route.
 */
export const emrPublicApi = axios.create({
  baseURL: EMR_PUBLIC_API_BASE_URL,
  timeout: 20000,
});
