import { createFileRoute } from '@tanstack/react-router';
import { EmrDashboardPage } from '@/features/emr/pages/dashboard-page';

export const Route = createFileRoute('/_authenticated/emr/')({
  component: EmrDashboardPage,
});
