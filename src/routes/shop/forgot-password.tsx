import { createFileRoute } from '@tanstack/react-router';
import ForgotPasswordPage from '@/features/damorex/auth/forgot-password';

export const Route = createFileRoute('/shop/forgot-password')({
  component: ForgotPasswordPage,
});
