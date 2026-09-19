import { ActionIcon, Badge, Button, Group, Select, Text } from '@mantine/core';
import { Plus, RefreshCcw, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomers, useDispenseOrders, usePriceLists, useSearchSales } from '../../api/posApi';
import { SaleSession } from '../types';
import { CustomerQuickAddModal } from './CustomerQuickAddModal';

interface Props {
  session: SaleSession;
  onCustomerChange: (customerId: string, customerName: string) => void;
  onPriceListChange: (priceListId: string, priceListName: string) => void;
  onPricingModeChange: (mode: 'retail' | 'wholesale') => void;
  onReset: () => void;
  onSettings: () => void;
  onLoadSale: (saleId: string) => void;
  onLoadOrder: (orderId: string) => void;
  onHeldSalesOpen: () => void;
  heldSalesCount: number;
}

const ORDER_OPTION_PREFIX = 'order:';

export function PosToolbar({
  session,
  onCustomerChange,
  onPriceListChange,
  onPricingModeChange: _onPricingModeChange,
  onReset,
  onSettings,
  onLoadSale,
  onLoadOrder,
  onHeldSalesOpen,
  heldSalesCount,
}: Props) {
  const [customerModal, setCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [priceListSearch, setPriceListSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [] } = useCustomers(customerSearch);
  const { data: priceLists = [] } = usePriceLists(priceListSearch);
  const { data: sales = [] } = useSearchSales(saleSearch);
  const { data: dispenseOrders = [] } = useDispenseOrders(saleSearch);

  const customerData = (Array.isArray(customers) ? customers : []).map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  const priceListData = (Array.isArray(priceLists) ? priceLists : []).map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  const saleData = (Array.isArray(sales) ? sales : []).map((s: any) => ({
    value: s.id,
    label: `${s.saleNumber} - ₦${s.totalAmount?.toFixed(2) ?? '0.00'}`,
  }));

  const orderData = (Array.isArray(dispenseOrders) ? dispenseOrders : []).map((o: any) => ({
    value: `${ORDER_OPTION_PREFIX}${o.id}`,
    label: `Dispense ${o.orderNumber}${o.externalReference ? ` · ${o.externalReference}` : ''} (${o.items?.length ?? 0} lines)`,
  }));

  const loadData = [
    ...orderData,
    ...saleData,
  ];

  function handleLoad(value: string | null) {
    if (!value) { return; }
    if (value.startsWith(ORDER_OPTION_PREFIX)) {
      onLoadOrder(value.slice(ORDER_OPTION_PREFIX.length));
    } else {
      onLoadSale(value);
    }
  }

  return (
    <>
      <Group px="md" py="xs" bg="#bfe0ea" gap="sm">
        <Select
          size="xs"
          placeholder="Choose Customer"
          data={customerData}
          value={session.customerId || null}
          onChange={(value, option) => {
            if (value) {onCustomerChange(value, option.label);}
          }}
          onSearchChange={setCustomerSearch}
          searchable
          clearable
          w={220}
          disabled={session.status === 'completed'}
        />

        <Button size="xs" leftSection={<Plus size={14} />} onClick={() => setCustomerModal(true)}>
          + Customer
        </Button>

        <Text fw={700} size="sm">
          Customer: {session.customerName || 'Walk-in'}
        </Text>

        <Select
          size="xs"
          placeholder="Price List"
          data={priceListData}
          value={session.priceListId || null}
          onChange={(value, option) => {
            if (value) {onPriceListChange(value, option.label);}
          }}
          onSearchChange={setPriceListSearch}
          searchable
          clearable
          w={200}
          disabled={session.status === 'completed'}
        />

        <Button size="xs" leftSection={<Search size={14} />} onClick={onHeldSalesOpen}>
          Held Sales {heldSalesCount > 0 && <Badge ml={4} size="xs">{heldSalesCount}</Badge>}
        </Button>

        <Select
          size="xs"
          placeholder="Load Sale or Dispense Order"
          data={loadData}
          onSearchChange={setSaleSearch}
          onChange={handleLoad}
          searchable
          clearable
          w={260}
          leftSection={<Search size={14} />}
          nothingFoundMessage="No sales or orders found"
        />

        <Button
          size="xs"
          variant="light"
          leftSection={<RefreshCcw size={14} />}
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['pos-items'] });
            queryClient.invalidateQueries({ queryKey: ['item-uoms'] });
            queryClient.invalidateQueries({ queryKey: ['price-list-items'] });
            queryClient.invalidateQueries({ queryKey: ['stock-locations'] });
            queryClient.invalidateQueries({ queryKey: ['user-pos-config'] });
            queryClient.invalidateQueries({ queryKey: ['pos-stock-qty'] });
          }}
        >
          Refresh
        </Button>

        <Button size="xs" color="red" leftSection={<RefreshCcw size={14} />} onClick={onReset} disabled={session.status === 'completed'}>
          Reset POS
        </Button>

        <ActionIcon size="lg" variant="light" onClick={onSettings}>
          <Settings size={18} />
        </ActionIcon>
      </Group>

      <CustomerQuickAddModal
        opened={customerModal}
        onClose={() => setCustomerModal(false)}
        onCustomerCreated={(c) => {
          onCustomerChange(c.id, c.name);
          setCustomerModal(false);
        }}
      />
    </>
  );
}
