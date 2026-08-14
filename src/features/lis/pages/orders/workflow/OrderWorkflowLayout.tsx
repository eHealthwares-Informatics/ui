import { Stack } from '@mantine/core';
import { useLocation } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';
import { BarcodeScannerBar } from './BarcodeScannerBar';
import { useOrderContext } from './OrderContext';
import { OrderContextCard } from './OrderContextCard';
import { OrderStepper } from './OrderStepper';

const STEP_ROUTES = [
  '/lis/orders/workflow/enter',
  '/lis/orders/workflow/collect',
  '/lis/orders/workflow/label',
  '/lis/orders/workflow/qa',
  '/lis/orders/workflow/order',
];

export function OrderWorkflowLayout({
  orderNumber,
  children,
}: {
  orderNumber?: string;
  children: ReactNode;
}) {
  const { state, loadOrder, dispatch } = useOrderContext();
  const { pathname } = useLocation();

  useEffect(() => {
    const step = STEP_ROUTES.findIndex((route) => pathname.startsWith(route));
    if (step >= 0) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!orderNumber || state.orderNumber === orderNumber) {
      return;
    }
    let cancelled = false;
    lisApi
      .get('/lis/orders', { params: { search: orderNumber, limit: 5 } })
      .then((res) => {
        if (cancelled) {
          return;
        }
        const match = (res.data?.data ?? []).find((o: any) => o.orderNumber === orderNumber);
        if (match) {
          loadOrder(match.id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderNumber, state.orderNumber, loadOrder]);

  return (
    <RxPage
      title="Workflow"
      description="Multi-step order entry workflow"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Orders', href: '/lis/orders' },
        { label: 'Workflow' },
      ]}
    >
      <Stack gap="md">
        <BarcodeScannerBar />
        <OrderStepper />
        <OrderContextCard />
        {children}
      </Stack>
    </RxPage>
  );
}
