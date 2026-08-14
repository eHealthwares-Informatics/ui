import { createFileRoute } from '@tanstack/react-router';
import { OrderLabelPage } from '@/features/lis/pages/orders/workflow/label/page';

export const Route = createFileRoute('/_authenticated/lis/orders/workflow/label')({
  component: OrderLabelPage,
});
