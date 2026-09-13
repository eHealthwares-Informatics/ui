import { createFileRoute } from '@tanstack/react-router';
import { IdentityUsersPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/users/')({
  component: IdentityUsersPage,
});
