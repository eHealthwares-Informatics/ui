import { createFileRoute } from '@tanstack/react-router';
import OrderDetailPage from '@/features/damorex/orders/detail';

export const Route = createFileRoute('/shop/orders_/$id')({
  component: OrderDetailPage,
});
