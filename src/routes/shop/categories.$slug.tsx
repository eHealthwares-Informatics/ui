import { createFileRoute } from '@tanstack/react-router';
import CategoryProductsPage from '@/features/shop/categories/category';

export const Route = createFileRoute('/shop/categories/$slug')({
  component: CategoryProductsPage,
});
