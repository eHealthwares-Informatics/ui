import { createFileRoute } from '@tanstack/react-router';
import { IdentityLocationsPage } from '@/features/identity/pages';

export const Route = createFileRoute('/_authenticated/identity/locations/')({
  component: IdentityLocationsPage,
});
