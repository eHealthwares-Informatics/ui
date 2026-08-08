import { createFileRoute } from '@tanstack/react-router';
import { LisOrderReportPage } from '@/features/lis/pages';

export const Route = createFileRoute('/_authenticated/lis/orders/$orderId/report')({
  component: LisOrderReportPage,
});
