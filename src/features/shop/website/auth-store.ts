import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistTokens, getAccessToken, getRefreshToken, clearTokens } from '@/lib/auth-tokens';
import { websiteApi } from './api';

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
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: {
    username: string;
    email?: string;
    phone?: string;
    password: string;
  }) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ sent: boolean; channel: string; code?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  googleSignIn: (accessToken: string) => Promise<void>;
  facebookSignIn: (accessToken: string) => Promise<void>;
}

/**
 * Phone-only accounts receive their user id in the token's `email` claim.
 * Treat anything that is not a real address (or that equals the user id) as
 * empty so it never leaks into forms like checkout.
 */
export function normaliseWebsiteEmail(email: unknown, userId?: string | null): string {
  const value = typeof email === 'string' ? email.trim() : '';
  if (!value || !value.includes('@') || (userId && value === userId)) {
    return '';
  }
  return value;
}

function decodeToken(token: string): WebsiteUser {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    id: payload.sub,
    username: payload.username,
    email: normaliseWebsiteEmail(payload.email, payload.sub),
    phone: payload.phone || '',
    roles: payload.roles || [],
  };
}

function tryImportAdminSession(): {
  user: WebsiteUser;
  accessToken: string;
  refreshToken: string;
} | null {
  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (!token || !refresh) {
    return null;
  }
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

      login: async (username, password, remember) => {
        const res = await websiteApi.login({ username, password });
        persistTokens(res.accessToken, res.refreshToken, remember);
        const user = decodeToken(res.accessToken);
        set({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },

      register: async (data) => {
        const res = await websiteApi.register(data);
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },

      requestOtp: async (phone) => {
        return websiteApi.requestOtp({ phone, channel: 'sms' });
      },

      verifyOtp: async (phone, code) => {
        const res = await websiteApi.verifyOtp({ phone, code });
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },

      googleSignIn: async (accessToken) => {
        const res = await websiteApi.googleSignIn(accessToken);
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },

      facebookSignIn: async (accessToken) => {
        const res = await websiteApi.facebookSignIn(accessToken);
        persistTokens(res.accessToken, res.refreshToken);
        const user = decodeToken(res.accessToken);
        set({
          user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'rxsoft-website-auth',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<WebsiteAuthStore>) };
        if (merged.user) {
          merged.user = {
            ...merged.user,
            email: normaliseWebsiteEmail(merged.user.email, merged.user.id),
          };
        }

        // Keep the persisted session and the token storage in sync. The store
        // can say "authenticated" while `getAccessToken()` is empty (new tab
        // with sessionStorage, or a cleared token store), which sent checkout
        // requests without a bearer token — e.g. /payments/initialize then
        // failed with "Missing bearer token".
        if (merged.accessToken && !getAccessToken()) {
          persistTokens(merged.accessToken, merged.refreshToken ?? '');
        }

        if (!merged.accessToken) {
          const session = tryImportAdminSession();
          if (session) {
            merged.user = session.user;
            merged.accessToken = session.accessToken;
            merged.refreshToken = session.refreshToken;
            merged.isAuthenticated = true;
          }
        }

        // No usable session at all: don't leave the UI "signed in" while every
        // request goes out unauthenticated.
        if (!merged.accessToken) {
          merged.user = null;
          merged.isAuthenticated = false;
        }
        return merged;
      },
    }
  )
);
