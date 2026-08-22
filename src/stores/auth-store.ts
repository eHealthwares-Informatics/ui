import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clearTokens,
  decodeUserFromAccessToken,
  getAccessToken,
  getRefreshToken,
  persistTokens,
  type AuthUser,
} from '@/lib/auth-tokens';
import { identityApi } from '@/lib/identity-api';

export type ModuleInfo = {
  id: string;
  name: string;
  description: string;
  root: string;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  modules: ModuleInfo[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  logoutAll: () => Promise<void>;
  bootstrap: () => void;
  fetchModules: (force?: boolean) => Promise<void>;
  pendingModulesFetch: Promise<void> | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      modules: [],
      loading: false,
      error: null,
      pendingModulesFetch: null,

      login: async (username, password) => {
        set({ loading: true, error: null });
        try {
          const response = await identityApi.post<{
            accessToken: string;
            refreshToken: string;
          }>('/auth/login', { username, password });
          persistTokens(response.data.accessToken, response.data.refreshToken);
          const user = decodeUserFromAccessToken(response.data.accessToken);

          if (!user) {
            throw new Error('Invalid access token payload.');
          }

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            user,
            loading: false,
            error: null,
          });

          // Fetch user modules after login
          try {
            const meResponse = await identityApi.get<{
              id: string;
              username: string;
              roles: string[];
              permissions: string[];
              modules: ModuleInfo[];
            }>('/auth/me');
            set({ modules: meResponse.data.modules });
          } catch {
            set({
              modules: [
                { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy Admin', root: '/items' },
                { id: 'admin', name: 'Admin Console', description: 'Administration', root: '/' },
              ],
            });
          }
        } catch {
          set({ loading: false, error: 'Invalid credentials' });
        }
      },

      logout: () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Best-effort server-side revocation of the current refresh token.
          void identityApi.post('/auth/logout', { refreshToken }).catch(() => {
            // Local session is cleared regardless of whether revocation succeeds.
          });
        }
        clearTokens();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          modules: [],
          loading: false,
          error: null,
          pendingModulesFetch: null,
        });
      },

      logoutAll: async () => {
        const refreshToken = getRefreshToken();
        try {
          if (refreshToken) {
            await identityApi.post('/auth/logout-all', { refreshToken });
          }
        } catch {
          // Fall through — clear the local session even if revocation fails.
        }
        clearTokens();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          modules: [],
          loading: false,
          error: null,
          pendingModulesFetch: null,
        });
      },

      bootstrap: () => {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken || !refreshToken) {
          return;
        }

        const user = decodeUserFromAccessToken(accessToken);
        if (!user) {
          clearTokens();
          set({ accessToken: null, refreshToken: null, user: null });
          return;
        }

        set({ accessToken, refreshToken, user, loading: false, error: null });

        // Always refresh the module list in the background so modules granted
        // server-side (e.g. EMR) appear without requiring a re-login. The
        // persisted list remains as a synchronous fallback for route redirects.
        if (user) {
          get().fetchModules(true);
        }
      },

      fetchModules: async (force = false) => {
        if (!force && (get().modules.length > 0 || get().pendingModulesFetch)) {
          return get().pendingModulesFetch ?? Promise.resolve();
        }

        const pending = (async () => {
          try {
            const meResponse = await identityApi.get<{
              id: string;
              username: string;
              roles: string[];
              permissions: string[];
              modules: ModuleInfo[];
            }>('/auth/me');
            set({ modules: meResponse.data.modules });
          } catch {
            // Silently fail - modules will be empty until fetched
          } finally {
            set({ pendingModulesFetch: null });
          }
        })();

        set({ pendingModulesFetch: pending });
        await pending;
      },
    }),
    { name: 'rxsoft-admin-auth' },
  ),
);
