import { createFileRoute } from '@tanstack/react-router';
import CheckoutPage from '@/features/shop/checkout/page';

export const Route = createFileRoute('/shop/checkout')({
  component: CheckoutPage,
});
