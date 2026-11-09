import { createFileRoute } from '@tanstack/react-router';
import { ForgotPassword } from '@/features/identity/auth/forgot-password';

export const Route = createFileRoute('/(auth)/forgot-password')({
  component: ForgotPassword,
});
