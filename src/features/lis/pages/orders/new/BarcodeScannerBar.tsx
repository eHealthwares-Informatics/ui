import { useEffect, useState } from 'react';
import { ActionIcon, Combobox, Group, Text, TextInput, Tooltip, useCombobox } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { lisApi } from '@/lib/lis-api';
import { useOrderContext } from './OrderContext';
import { Scan, X } from 'lucide-react';

interface OrderSuggestion {
  id: string;
  orderNumber: string;
  patientName: string;
}

export function BarcodeScannerBar() {
  const [value, setValue] = useState('');
  const [orders, setOrders] = useState<OrderSuggestion[]>([]);
  const [debounced] = useDebouncedValue(value, 300);
  const navigate = useNavigate();
  const combobox = useCombobox();
  const { state, dispatch, loadOrder } = useOrderContext();

  useEffect(() => {
    if (!debounced.trim()) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    lisApi
      .get('/lis/orders', { params: { search: debounced.trim(), limit: 10 } })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data?.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const openOrder = async (id: string, fallbackNumber?: string) => {
    const data = await loadOrder(id);
    dispatch({ type: 'SET_STEP', payload: 0 });
    navigate({
      to: '/lis/orders/new/enter',
      search: { orderNumber: data?.orderNumber ?? fallbackNumber ?? '' },
    });
  };

  const handleSearch = async () => {
    const q = value.trim();
    if (!q) return;
    try {
      const res = await lisApi.get('/lis/orders', { params: { search: q, limit: 5 } });
      const matches = res.data?.data ?? [];
      if (matches.length === 1) {
        await openOrder(matches[0].id, matches[0].orderNumber);
        return;
      }
      if (matches.length > 1) {
        navigate({ to: '/lis/orders', search: { search: q } as any });
        return;
      }
      const sampleRes = await lisApi.get('/lis/samples', { params: { search: q, limit: 1 } });
      const samples = sampleRes.data?.data ?? [];
      if (samples.length > 0 && samples[0].orderId) {
        await openOrder(samples[0].orderId);
      }
    } catch {
      /* noop */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (combobox.dropdownOpened) {
      const order = orders[combobox.getSelectedOptionIndex()];
      if (order) {
        e.preventDefault();
        openOrder(order.id, order.orderNumber);
        return;
      }
    }
    handleSearch();
  };

  return (
    <Group gap="xs">
      <Combobox
        store={combobox}
        onOptionSubmit={(selectedValue) => {
          const order = orders.find((o) => o.id === selectedValue);
          if (order) openOrder(order.id, order.orderNumber);
          combobox.closeDropdown();
        }}
      >
        <Combobox.Target>
          <TextInput
            placeholder="Search order number or scan barcode..."
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value);
              if (e.currentTarget.value) {
                combobox.openDropdown();
              } else {
                combobox.closeDropdown();
              }
            }}
            onFocus={() => combobox.openDropdown()}
            onKeyDown={handleKeyDown}
            leftSection={<Scan size={14} />}
            rightSection={
              value ? (
                <ActionIcon
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setValue('');
                    combobox.closeDropdown();
                  }}
                >
                  <X size={14} />
                </ActionIcon>
              ) : null
            }
            size="sm"
            style={{ flex: 1 }}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options style={{ maxHeight: 220, overflowY: 'auto' }}>
            {orders.length === 0 ? (
              <Combobox.Empty>
                {value.trim() ? 'No matching orders' : 'Type an order number to search'}
              </Combobox.Empty>
            ) : (
              orders.map((o) => (
                <Combobox.Option key={o.id} value={o.id}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="sm" fw={500}>
                      {o.orderNumber}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {o.patientName}
                    </Text>
                  </Group>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      <Tooltip label="Also searches by sample barcode">
        <ActionIcon variant="light" size="sm" onClick={handleSearch}>
          <Scan size={14} />
        </ActionIcon>
      </Tooltip>
      {state.orderId && (
        <Text size="xs" c="dimmed">
          Editing order <strong>{state.orderNumber}</strong>
        </Text>
      )}
    </Group>
  );
}
