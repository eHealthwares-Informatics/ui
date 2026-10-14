import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    useAuthStore.getState().bootstrap();
    const { user, modules: userModules } = useAuthStore.getState();
    if (!user) {
      throw redirect({ to: '/sign-in' });
    }

    // Single module: go straight to its dashboard. Multiple modules: the
    // module landing grid (default page after login — the user chooses).
    if (userModules.length === 1) {
      throw redirect({ href: `/${userModules[0].id}` });
    }
    throw redirect({ to: '/modules' });
  },
});
