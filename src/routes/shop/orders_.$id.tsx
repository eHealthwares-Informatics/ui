import { createFileRoute } from '@tanstack/react-router';
import OrderDetailPage from '@/features/shop/orders/detail';

export const Route = createFileRoute('/shop/orders_/$id')({
  component: OrderDetailPage,
});
