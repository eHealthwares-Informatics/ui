import { createFileRoute } from '@tanstack/react-router';
import { IdentityRolesPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/roles/')({
  component: IdentityRolesPage,
});
