import { createFileRoute } from '@tanstack/react-router';
import { LisOrdersDashboardPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/orders/dashboard')({
  component: LisOrdersDashboardPage,
});
