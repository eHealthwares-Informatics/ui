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

/**
 * How the effective permissions were resolved (access-control plan, phase 1):
 *  - 'org'  — permissions derive from the user's organisation-scoped roles
 *             (identity role_permissions is the single source today)
 *  - 'user' — reserved for user-direct permission grants (later phase)
 */
export type PermissionMode = 'org' | 'user';

/** Shape of identity's GET /auth/me response. */
export type MeResponse = {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  modules: ModuleInfo[];
  permissionMode: PermissionMode;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  modules: ModuleInfo[];
  permissionMode: PermissionMode;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  loginWithOAuth: (
    provider: 'google' | 'facebook',
    payload: { accessToken?: string; idToken?: string },
    remember?: boolean
  ) => Promise<void>;
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
      permissionMode: 'org',
      loading: false,
      error: null,
      pendingModulesFetch: null,

      login: async (username, password, remember) => {
        set({ loading: true, error: null });
        try {
          const response = await identityApi.post<{
            accessToken: string;
            refreshToken: string;
          }>('/auth/login', { username, password });
          persistTokens(response.data.accessToken, response.data.refreshToken, remember);
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
            const meResponse = await identityApi.get<MeResponse>('/auth/me');
            set({
              modules: meResponse.data.modules,
              permissionMode: meResponse.data.permissionMode,
            });
          } catch {
            set({
              modules: [
                { id: 'rxsoft', name: 'RxSoft', description: 'Pharmacy Admin', root: '/items' },
                { id: 'admin', name: 'Admin Console', description: 'Administration', root: '/' },
              ],
              permissionMode: 'org',
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
          permissionMode: 'org',
          loading: false,
          error: null,
          pendingModulesFetch: null,
        });
      },

      /**
       * Shared consumer-channel OAuth sign-in (Google/Facebook). The identity
       * service verifies the provider token server-side and either links the
       * verified email to any existing account role or auto-registers the
       * account; tokens are issued exactly like a password login.
       */
      loginWithOAuth: async (provider, payload, remember) => {
        set({ loading: true, error: null });
        try {
          const response = await identityApi.post<{
            accessToken: string;
            refreshToken: string;
          }>(`/auth/oauth/${provider}`, { ...payload, channel: 'console' });
          persistTokens(response.data.accessToken, response.data.refreshToken, remember);
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
          get().fetchModules();
        } catch (err) {
          const message =
            (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            'Social sign in failed';
          set({ loading: false, error: message });
        }
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
          permissionMode: 'org',
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

        // Refresh modules in the background, but only if they haven't been loaded
        // yet. Force-fetching on every navigation caused unnecessary re-renders
        // that collapsed sidebar submenus. The non-force call also dedupes
        // concurrent fetches via `pendingModulesFetch`, which prevents a
        // fetch/remount feedback loop (see ehealthwares/ui#84).
        if (user && get().modules.length === 0) {
          get().fetchModules();
        }
      },

      fetchModules: async (force = false) => {
        if (!force && (get().modules.length > 0 || get().pendingModulesFetch)) {
          return get().pendingModulesFetch ?? Promise.resolve();
        }

        const pending = (async () => {
          try {
            const meResponse = await identityApi.get<MeResponse>('/auth/me');
            set({
              modules: meResponse.data.modules,
              permissionMode: meResponse.data.permissionMode ?? 'org',
            });
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
    { name: 'rxsoft-admin-auth' }
  )
);
