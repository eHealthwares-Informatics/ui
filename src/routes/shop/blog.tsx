import { createFileRoute } from '@tanstack/react-router';
import BlogListPage from '@/features/damorex/blog/list';

export const Route = createFileRoute('/shop/blog')({
  component: BlogListPage,
});
