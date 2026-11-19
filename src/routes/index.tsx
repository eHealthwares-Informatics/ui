import { createFileRoute, redirect } from '@tanstack/react-router';
import { resolvePostLoginTarget } from '@/features/shared/module-landing/post-login-target';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    await useAuthStore.getState().bootstrap();
    const { user, modules: userModules } = useAuthStore.getState();
    if (!user) {
      throw redirect({ to: '/sign-in' });
    }

    // Remembered module → its dashboard; single module → its dashboard;
    // otherwise the module chooser grid. Same rule as a fresh sign-in.
    throw redirect({
      href: resolvePostLoginTarget(
        undefined,
        userModules.map((module) => module.id)
      ),
    });
  },
});
