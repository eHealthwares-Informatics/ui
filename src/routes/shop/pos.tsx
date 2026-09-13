import { createFileRoute, redirect } from '@tanstack/react-router';
import PharmacyPOS from '@/features/shop/pos/pos';
import { useAuthStore } from '@/stores/auth-store';

/* ================= ROUTE ================= */

function hasPosPermission(permissions: string[], roles: string[]) {
  if (roles.includes('super_admin') || roles.includes('admin')) {
    return true;
  }
  return permissions.some(
    (p) =>
      p === 'shop.pos' ||
      p === 'shop.*' ||
      p === 'rxsoft.*' ||
      p.startsWith('shop.pos.') ||
      (p.endsWith('.*') && p.startsWith('shop.')),
  );
}

export const Route = createFileRoute('/shop/pos')({
  beforeLoad: ({ location }) => {
    useAuthStore.getState().bootstrap();
    const user = useAuthStore.getState().user;
    if (!user) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      });
    }
    if (!hasPosPermission(user.permissions ?? [], user.roles ?? [])) {
      throw redirect({ to: '/403' });
    }
  },
  component: PharmacyPOS,
});