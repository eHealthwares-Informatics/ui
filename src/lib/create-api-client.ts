import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, persistTokens } from '@/lib/auth-tokens';

export const IDENTITY_API_BASE_URL =
  (import.meta.env.VITE_IDENTITY_API_URL as string | undefined) ?? 'http://localhost:8092';

export type SessionExpiredHandler = 'redirect' | 'ignore';

export type CreateAuthApiClientOptions = {
  baseURL: string;
  timeout?: number;
  /** Disable the 401 auto-refresh interceptor for clients that must not self-refer (e.g. the identity client itself). */
  enableRefresh?: boolean;
  /** What to do when there is no refresh token or the refresh fails. */
  onSessionExpired?: SessionExpiredHandler;
  /** What to do on 403 responses. */
  onForbidden?: SessionExpiredHandler;
};

let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function handleSessionExpired(mode: SessionExpiredHandler): void {
  clearTokens();
  if (mode === 'redirect') {
    window.location.href = '/sign-in';
  }
}

export function createAuthApiClient(options: CreateAuthApiClientOptions): AxiosInstance {
  const {
    baseURL,
    timeout = 15000,
    enableRefresh = true,
    onSessionExpired = 'redirect',
    onForbidden = 'redirect',
  } = options;

  const client = axios.create({ baseURL, timeout });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  if (enableRefresh) {
    client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const originalRequest = error.config as
          | (InternalAxiosRequestConfig & { _retry?: boolean })
          | undefined;

        if (!originalRequest) {
          return Promise.reject(error);
        }

        if (
          status === 401 &&
          !originalRequest._retry &&
          !String(originalRequest.url ?? '').includes('/auth/')
        ) {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            handleSessionExpired(onSessionExpired);
            return Promise.reject(error);
          }

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              queue.push({
                resolve: (token: string) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  void resolve(client(originalRequest));
                },
                reject,
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshResponse = await axios.post<{
              accessToken: string;
              refreshToken: string;
            }>(`${IDENTITY_API_BASE_URL}/auth/refresh-token`, { refreshToken });

            persistTokens(refreshResponse.data.accessToken, refreshResponse.data.refreshToken);
            queue.forEach((entry) => entry.resolve(refreshResponse.data.accessToken));
            queue = [];

            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return client(originalRequest);
          } catch (refreshError) {
            queue.forEach((entry) => entry.reject(refreshError));
            queue = [];
            handleSessionExpired(onSessionExpired);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        if (status === 403) {
          if (onForbidden === 'redirect') {
            window.location.href = '/403';
          }
        }

        if (status && status >= 500) {
          console.error('Server error', error.response?.data ?? error.message);
        }

        return Promise.reject(error);
      },
    );
  }

  return client;
}