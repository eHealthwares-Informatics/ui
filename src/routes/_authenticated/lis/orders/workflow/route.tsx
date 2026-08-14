import { createFileRoute, Outlet } from '@tanstack/react-router';
import { OrderProvider } from '@/features/lis/pages/orders/new/OrderContext';
import { OrderWorkflowLayout } from '@/features/lis/pages/orders/new/OrderWorkflowLayout';

export const Route = createFileRoute('/_authenticated/lis/orders/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    orderNumber: typeof search.orderNumber === 'string' ? search.orderNumber : undefined,
  }),
  component: NewOrderLayout,
});

function NewOrderLayout() {
  const { orderNumber } = Route.useSearch();
  return (
    <OrderProvider>
      <OrderWorkflowLayout orderNumber={orderNumber}>
        <Outlet />
      </OrderWorkflowLayout>
    </OrderProvider>
  );
}
