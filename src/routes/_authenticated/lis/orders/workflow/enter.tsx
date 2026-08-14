import { createFileRoute } from '@tanstack/react-router';
import { OrderEnterPage } from '@/features/lis/pages/orders/new/enter/page';

export const Route = createFileRoute('/_authenticated/lis/orders/new/enter')({
  component: OrderEnterPage,
});
