import { createFileRoute } from '@tanstack/react-router';
import { OrderOrderPage } from '@/features/lis/pages/orders/workflow/order/page';

export const Route = createFileRoute('/_authenticated/lis/orders/workflow/order')({
  component: OrderOrderPage,
});
