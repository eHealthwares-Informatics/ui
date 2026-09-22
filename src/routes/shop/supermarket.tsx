import { createFileRoute } from '@tanstack/react-router';
import SupermarketPage from '@/features/shop/shop/supermarket';

export const Route = createFileRoute('/shop/supermarket')({
  component: SupermarketPage,
});
