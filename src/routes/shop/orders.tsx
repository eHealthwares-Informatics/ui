import { createFileRoute } from '@tanstack/react-router';
import OrdersPage from '@/features/damorex/orders/list';

export const Route = createFileRoute('/shop/orders')({
  component: OrdersPage,
});
