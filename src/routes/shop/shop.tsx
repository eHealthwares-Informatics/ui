import { createFileRoute } from '@tanstack/react-router';
import ShopPage from '@/features/shop/shop/page';

export const Route = createFileRoute('/shop/shop')({
  component: ShopPage,
});