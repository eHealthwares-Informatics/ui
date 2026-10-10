import { Tabs } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { RxPage } from '../../../components/page/rx-page';
import type { ModelConfig, RowAction } from '../../../shared/model-schema';
import {
  ORDER_LISTING_TABS,
  ordersListConfig,
  prescriptionsListConfig,
  reminderColumns,
  salesListConfig,
  type OrderListingTab,
} from './schema';

/**
 * Consolidated order-listing screen. Prescriptions, Orders, Sales and Reminders
 * share one screen; each tab keeps the same filter/sort toolbar but renders
 * type-specific columns and row controls. Every tab is date-sortable.
 */
export function RxOrdersPage() {
  const [tab, setTab] = useState<OrderListingTab>('orders');
  const queryClient = useQueryClient();

  const remindersConfig = useMemo<ModelConfig>(() => {
    const setStatus = (id: string, status: string) => {
      rxsoftApi
        .patch(`/refills/${id}`, { status })
        .then(() => {
          notifications.show({ message: `Refill marked ${status}.`, color: 'green' });
          queryClient.invalidateQueries({ queryKey: ['rxsoft-data-page', '/refills'] });
        })
        .catch((err) => {
          notifications.show({ message: getApiErrorMessage(err), color: 'red' });
        });
    };

    const rowActions: RowAction[] = [
      { label: 'Mark complete', onClick: (row) => setStatus(String(row.id), 'completed') },
      { label: 'Mark due', onClick: (row) => setStatus(String(row.id), 'due') },
      { label: 'Cancel', onClick: (row) => setStatus(String(row.id), 'cancelled') },
    ];

    return {
      id: 'reminders-listing',
      title: 'Reminders',
      description: 'Refill reminders created from sales and sale lines.',
      endpoint: '/refills',
      columns: reminderColumns,
      canDelete: false,
      defaultSort: { sortBy: 'nextDueDate', sortOrder: 'asc' },
      rowActions,
    };
  }, [queryClient]);

  const configs: Record<OrderListingTab, ModelConfig> = {
    orders: ordersListConfig,
    prescriptions: prescriptionsListConfig,
    sales: salesListConfig,
    reminders: remindersConfig,
  };

  return (
    <RxPage
      title="Orders"
      description="Prescriptions, orders, sales and refill reminders — filter and sort on one screen."
    >
      <Tabs value={tab} onChange={(v) => v && setTab(v as OrderListingTab)} keepMounted={false}>
        <Tabs.List>
          {ORDER_LISTING_TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value}>
              {t.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value={tab} pt="md">
          <DataPageShell key={tab} config={configs[tab]} embedded />
        </Tabs.Panel>
      </Tabs>
    </RxPage>
  );
}
