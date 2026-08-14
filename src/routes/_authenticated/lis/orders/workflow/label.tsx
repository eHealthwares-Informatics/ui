import { createFileRoute } from '@tanstack/react-router';
import { OrderLabelPage } from '@/features/lis/pages/orders/new/label/page';

export const Route = createFileRoute('/_authenticated/lis/orders/new/label')({
  component: OrderLabelPage,
});
