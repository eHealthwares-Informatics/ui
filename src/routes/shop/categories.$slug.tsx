import { createFileRoute } from '@tanstack/react-router';
import CategoryProductsPage from '@/features/damorex/categories/category';

export const Route = createFileRoute('/shop/categories/$slug')({
  component: CategoryProductsPage,
});
