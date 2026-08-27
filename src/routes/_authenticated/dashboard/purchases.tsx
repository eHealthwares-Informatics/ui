import { createFileRoute } from '@tanstack/react-router';
import { PurchasesDashboardPage } from '@/features/rxsoft/pages';

export const Route = createFileRoute('/_authenticated/dashboard/purchases')({
  component: PurchasesDashboardPage,
});
