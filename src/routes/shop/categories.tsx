import { createFileRoute } from '@tanstack/react-router';
import CategoriesPage from '@/features/shop/categories/page';

export const Route = createFileRoute('/shop/categories')({
  component: CategoriesPage,
});
