import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { AdminLayout } from '@/features/apm/admin/AdminLayout';
import { getAccessToken } from '@/lib/auth-tokens';

export const Route = createFileRoute('/apm/admin')({
  component: AdminLayout,
  beforeLoad: ({ location }) => {
    const token = getAccessToken();
    if (!token) {
      throw redirect({ to: '/sign-in', search: { redirect: location.pathname + location.search } });
    }
  },
});
