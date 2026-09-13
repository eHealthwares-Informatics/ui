import { createFileRoute } from '@tanstack/react-router';
import ProductDetailPage from '@/features/shop/shop/product';

export const Route = createFileRoute('/shop/shop_/$slug')({
  component: ProductDetailPage,
});
