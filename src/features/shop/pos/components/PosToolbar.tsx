import { ActionIcon, Badge, Button, Group, Select, Text } from '@mantine/core';
import { Plus, RefreshCcw, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomers, usePriceLists, useSearchSales } from '../../api/posApi';
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
  onHeldSalesOpen: () => void;
  heldSalesCount: number;
}

export function PosToolbar({
  session,
  onCustomerChange,
  onPriceListChange,
  onPricingModeChange,
  onReset,
  onSettings,
  onLoadSale,
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
          placeholder="Load Sale by #"
          data={saleData}
          onSearchChange={setSaleSearch}
          onChange={(value) => {
            if (value) {onLoadSale(value);}
          }}
          searchable
          clearable
          w={200}
          leftSection={<Search size={14} />}
          nothingFoundMessage="No sales found"
        />

        <Button
          size="xs"
          variant="light"
          leftSection={<RefreshCcw size={14} />}
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['whitelisted-items'] });
            queryClient.invalidateQueries({ queryKey: ['price-list-items'] });
            queryClient.invalidateQueries({ queryKey: ['uoms'] });
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
