import { createFileRoute } from '@tanstack/react-router';
import CheckoutPage from '@/features/damorex/checkout/page';

export const Route = createFileRoute('/shop/checkout')({
  component: CheckoutPage,
});
