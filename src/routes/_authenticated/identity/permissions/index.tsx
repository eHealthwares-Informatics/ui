import { createFileRoute } from '@tanstack/react-router';
import { IdentityPermissionsPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/permissions/')({
  component: IdentityPermissionsPage,
});
