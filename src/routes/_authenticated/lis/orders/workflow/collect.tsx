import { createFileRoute } from '@tanstack/react-router';
import { OrderCollectPage } from '@/features/lis/pages/orders/workflow/collect/page';

export const Route = createFileRoute('/_authenticated/lis/orders/workflow/collect')({
  component: OrderCollectPage,
});
