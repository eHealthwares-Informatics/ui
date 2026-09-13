import { createFileRoute } from '@tanstack/react-router';
import BranchesPage from '@/features/shop/branches/list';

export const Route = createFileRoute('/shop/branches')({
  component: BranchesPage,
});
