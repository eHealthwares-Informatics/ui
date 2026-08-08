import { createFileRoute } from '@tanstack/react-router';
import { OrderQAPage } from '@/features/lis/pages/orders/new/qa/page';

export const Route = createFileRoute('/_authenticated/lis/orders/new/qa')({
  component: OrderQAPage,
});
