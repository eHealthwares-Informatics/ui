import { createFileRoute } from '@tanstack/react-router';
import BranchDetailPage from '@/features/shop/branches/detail';

export const Route = createFileRoute('/shop/branches/$id')({
  component: BranchDetailPage,
});
