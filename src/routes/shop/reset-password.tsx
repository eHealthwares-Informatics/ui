import { createFileRoute } from '@tanstack/react-router';
import ResetPasswordPage from '@/features/shop/auth/reset-password';

export const Route = createFileRoute('/shop/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
