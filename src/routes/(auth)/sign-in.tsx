import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { SignIn } from '@/features/identity/auth/sign-in';
import { resolvePostLoginTarget } from '@/features/shared/module-landing/post-login-target';
import { useAuthStore } from '@/stores/auth-store';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    // Auto-login: a valid (or refreshable) session means the user should not
    // see the sign-in page at all — this is what makes opening the app in a
    // second tab land on the current module without re-entering credentials.
    await useAuthStore.getState().bootstrap();
    const { user, modules } = useAuthStore.getState();
    if (!user) {
      return;
    }
    throw redirect({
      href: resolvePostLoginTarget(
        search.redirect,
        modules.map((module) => module.id)
      ),
    });
  },
});
