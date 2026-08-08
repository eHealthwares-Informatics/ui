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
      throw redirect({ to: '/rxsoft/items' });
    }
  },
});
