import { useAuthStore } from '@/stores/auth-store';

/** Single source of truth for the `super_admin` role check. */
export function useIsSuperAdmin(): boolean {
  return useAuthStore((state) => state.user?.roles?.includes('super_admin') ?? false);
}

export function isSuperAdminUser(user: { roles?: string[] } | null | undefined): boolean {
  return user?.roles?.includes('super_admin') ?? false;
}
