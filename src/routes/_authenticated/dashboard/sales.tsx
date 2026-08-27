import { createFileRoute } from '@tanstack/react-router';
import { SalesAnalyticsPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/dashboard/sales')({
  component: SalesAnalyticsPage,
});
