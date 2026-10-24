import { createFileRoute, redirect } from '@tanstack/react-router';
import { PosAuthGate } from '@/features/shop/pos/components/PosAuthGate';
import { hasPosPermission } from '@/features/shop/pos/permissions';
import { useAuthStore } from '@/stores/auth-store';

/* ================= ROUTE ================= */

export const Route = createFileRoute('/shop/pos')({
  beforeLoad: () => {
    useAuthStore.getState().bootstrap();
    const user = useAuthStore.getState().user;

    // No session — or an expired one, which `bootstrap` clears — is handled by
    // PosAuthGate's inline quick-login form instead of bouncing to sign-in.
    // Only reject a live session that lacks POS permission.
    if (user && !hasPosPermission(user.permissions ?? [], user.roles ?? [])) {
      throw redirect({ to: '/403' });
    }
  },
  component: PosAuthGate,
});
