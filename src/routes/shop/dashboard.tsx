import { createFileRoute } from '@tanstack/react-router';
import DashboardPage from '@/features/shop/dashboard/page';

export const Route = createFileRoute('/shop/dashboard')({
  component: DashboardPage,
});
