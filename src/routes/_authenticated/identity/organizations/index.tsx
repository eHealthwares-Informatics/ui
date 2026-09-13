import { createFileRoute } from '@tanstack/react-router';
import { IdentityOrganizationsPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/organizations/')({
  component: IdentityOrganizationsPage,
});
