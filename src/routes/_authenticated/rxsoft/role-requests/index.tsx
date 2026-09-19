import { createFileRoute } from '@tanstack/react-router';
import { RoleRequestsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/rxsoft/role-requests/')({
  component: RoleRequestsPage,
});