import { createFileRoute } from '@tanstack/react-router';
import ArticlePage from '@/features/shop/blog/article';

export const Route = createFileRoute('/shop/blog/$slug')({
  component: ArticlePage,
});
