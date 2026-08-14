import { createFileRoute } from '@tanstack/react-router';
import { OrderCollectPage } from '@/features/lis/pages/orders/new/collect/page';

export const Route = createFileRoute('/_authenticated/lis/orders/new/collect')({
  component: OrderCollectPage,
});
