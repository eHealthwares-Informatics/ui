import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    useAuthStore.getState().bootstrap();
    const { user, modules: userModules } = useAuthStore.getState();
    if (!user) {
      throw redirect({ to: '/sign-in' });
    }

    const hasRxsoft = userModules.some((m) => m.id === 'rxsoft');
    if (hasRxsoft) {
      throw redirect({ to: '/dashboard/sales' });
    }

    // Modules may still be loading (or /auth/me failed) — never render a blank
    // page at "/". Fall back to the first known module, else sign-in.
    const firstModule = userModules[0];
    if (firstModule?.root) {
      throw redirect({ href: `/${firstModule.id}${firstModule.root}` });
    }
    throw redirect({ to: '/sign-in' });
  },
});
