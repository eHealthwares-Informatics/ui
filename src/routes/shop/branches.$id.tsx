import { createFileRoute } from '@tanstack/react-router';
import BranchDetailPage from '@/features/damorex/branches/detail';

export const Route = createFileRoute('/shop/branches/$id')({
  component: BranchDetailPage,
});
