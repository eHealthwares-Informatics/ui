import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { websiteApi } from './api';
import { persistTokens, getAccessToken, getRefreshToken, clearTokens } from '@/lib/auth-tokens';

export interface WebsiteUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  roles: string[];
}

export interface WebsiteAuthStore {
  user: WebsiteUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: WebsiteUser, token: string, refreshToken: string) => void;
  logout: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email?: string; phone?: string; password: string }) => Promise<void>;
}

function decodeToken(token: string): WebsiteUser {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    id: payload.sub,
    username: payload.username,
    email: payload.email || '',
    phone: payload.phone || '',
    roles: payload.roles || [],
  };
}

function tryImportAdminSession(): { user: WebsiteUser; accessToken: string; refreshToken: string } | null {
  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (!token || !refresh) return null;
  try {
    return { user: decodeToken(token), accessToken: token, refreshToken: refresh };
  } catch {
    return null;
  }
}

export const useAuthStore = create<WebsiteAuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user, token, refreshToken) => {
        persistTokens(token, refreshToken);
        set({ user, accessToken: token, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      login: async (username, password) => {
        const res = await websiteApi.login({ username, password });
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({ user, accessToken: res.accessToken, refreshToken: res.refreshToken, isAuthenticated: true });
      },

      register: async (data) => {
        const res = await websiteApi.register(data);
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({ user, accessToken: res.accessToken, refreshToken: res.refreshToken, isAuthenticated: true });
      },
    }),
    {
      name: 'rxsoft-website-auth',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<WebsiteAuthStore>) };
        if (!merged.accessToken) {
          const session = tryImportAdminSession();
          if (session) {
            merged.user = session.user;
            merged.accessToken = session.accessToken;
            merged.refreshToken = session.refreshToken;
            merged.isAuthenticated = true;
          }
        }
        return merged;
      },
    },
  ),
);
