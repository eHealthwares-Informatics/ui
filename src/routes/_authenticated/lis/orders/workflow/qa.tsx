import { createFileRoute } from '@tanstack/react-router';
import { OrderQAPage } from '@/features/lis/pages/orders/workflow/qa/page';

export const Route = createFileRoute('/_authenticated/lis/orders/workflow/qa')({
  component: OrderQAPage,
});
