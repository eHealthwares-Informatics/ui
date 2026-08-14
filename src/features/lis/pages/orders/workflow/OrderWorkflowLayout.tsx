import { useEffect } from 'react';
import { Stack } from '@mantine/core';
import { type ReactNode } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { OrderStepper } from './OrderStepper';
import { OrderContextCard } from './OrderContextCard';
import { BarcodeScannerBar } from './BarcodeScannerBar';
import { useOrderContext } from './OrderContext';
import { lisApi } from '@/lib/lis-api';

export function OrderWorkflowLayout({ orderNumber, children }: { orderNumber?: string; children: ReactNode }) {
  const { state, loadOrder } = useOrderContext();

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
      title="New Order"
      description="Multi-step order entry workflow"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Orders', href: '/lis/orders' },
        { label: 'New Order' },
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
