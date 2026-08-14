import { createFileRoute } from '@tanstack/react-router';
import { OrderEnterPage } from '@/features/lis/pages/orders/workflow/enter/page';

export const Route = createFileRoute('/_authenticated/lis/orders/workflow/enter')({
  component: OrderEnterPage,
});
