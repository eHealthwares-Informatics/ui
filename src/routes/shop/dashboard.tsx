import { createFileRoute } from '@tanstack/react-router';
import DashboardPage from '@/features/damorex/dashboard/page';

export const Route = createFileRoute('/shop/dashboard')({
  component: DashboardPage,
});
