import { createFileRoute } from '@tanstack/react-router';
import BranchesPage from '@/features/damorex/branches/list';

export const Route = createFileRoute('/shop/branches')({
  component: BranchesPage,
});
