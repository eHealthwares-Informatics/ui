import { createFileRoute } from '@tanstack/react-router';
import { FeaturesAdminPage } from '@/features/emr/pages/features-admin-page';

export const Route = createFileRoute('/_authenticated/emr/features/')({
  component: FeaturesAdminPage,
});
