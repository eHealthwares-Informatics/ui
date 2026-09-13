import { createFileRoute } from '@tanstack/react-router';
import AuthPage from '@/features/shop/auth/login';

export const Route = createFileRoute('/shop/login')({
  component: AuthPage,
});
