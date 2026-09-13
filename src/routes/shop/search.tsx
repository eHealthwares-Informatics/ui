import { createFileRoute } from '@tanstack/react-router';
import SearchPage from '@/features/shop/search/page';

export const Route = createFileRoute('/shop/search')({
  component: SearchPage,
});
