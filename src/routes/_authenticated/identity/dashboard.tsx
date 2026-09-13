import { createFileRoute } from '@tanstack/react-router';
import { IdentityPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/dashboard')({
  component: IdentityPage,
});
