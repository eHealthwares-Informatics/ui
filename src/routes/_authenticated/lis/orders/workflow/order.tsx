import { createFileRoute } from '@tanstack/react-router';
import { OrderOrderPage } from '@/features/lis/pages/orders/new/order/page';

export const Route = createFileRoute('/_authenticated/lis/orders/new/order')({
  component: OrderOrderPage,
});
