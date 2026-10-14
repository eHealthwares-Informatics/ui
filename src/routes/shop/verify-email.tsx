import { createFileRoute } from '@tanstack/react-router';
import VerifyEmailPage from '@/features/shop/auth/verify-email';

export const Route = createFileRoute('/shop/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
    // Optional: lets the verification email deep-link prefill the resend field.
    email: typeof search.email === 'string' ? search.email : '',
  }),
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { token, email } = Route.useSearch();
  return <VerifyEmailPage token={token} email={email} />;
}
