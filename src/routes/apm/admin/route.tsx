import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { getAccessToken } from '@/lib/auth-tokens';
import { AdminLayout } from '@/features/apm/admin/AdminLayout';

export const Route = createFileRoute('/apm/admin')({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    const token = getAccessToken();
    if (!token) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    }
  },
});
