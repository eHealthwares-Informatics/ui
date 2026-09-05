import { createFileRoute } from '@tanstack/react-router';
import CartPage from '@/features/damorex/cart/page';

export const Route = createFileRoute('/shop/cart')({
  component: CartPage,
});
