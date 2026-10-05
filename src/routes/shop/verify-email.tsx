import { createFileRoute } from '@tanstack/react-router';
import VerifyEmailPage from '@/features/shop/auth/verify-email';

export const Route = createFileRoute('/shop/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { token } = Route.useSearch();
  return <VerifyEmailPage token={token} />;
}
