import { createFileRoute, redirect } from '@tanstack/react-router';
import { SignIn2 } from '@/features/identity/auth/sign-in/sign-in-2';
import { resolvePostLoginTarget } from '@/features/shared/module-landing/post-login-target';
import { useAuthStore } from '@/stores/auth-store';

export const Route = createFileRoute('/(auth)/sign-in-2')({
  component: SignIn2,
  beforeLoad: async () => {
    await useAuthStore.getState().bootstrap();
    const { user, modules } = useAuthStore.getState();
    if (!user) {
      return;
    }
    throw redirect({
      href: resolvePostLoginTarget(
        undefined,
        modules.map((module) => module.id)
      ),
    });
  },
});
