import { createFileRoute } from '@tanstack/react-router';
import AuthPage from '@/features/damorex/auth/login';

export const Route = createFileRoute('/shop/login')({
  component: AuthPage,
});
