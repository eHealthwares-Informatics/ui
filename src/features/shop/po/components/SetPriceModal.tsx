import { Button, Group, Modal, NumberInput, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

interface UomInfo {
  id: string;
  code: string | null;
  name: string;
}

interface ItemWithUoms {
  id: string;
  baseUomId: string;
  purchaseUomId: string | null;
  baseUom: UomInfo | null;
  purchaseUom: UomInfo | null;
}

interface PriceListItem {
  id: string;
  unitPrice: number;
  currencyCode: string;
  priceList: { id: string; code: string; name: string };
}

interface UomData {
  id: string;
  name: string;
  code?: string;
  factor: number;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: (unitCost: number) => void;
  itemId: string;
  currentUnitCost: number;
}

export function SetPriceModal({ opened, onClose, onConfirm, itemId, currentUnitCost }: Props) {
  const [price, setPrice] = useState<number>(currentUnitCost || 0);

  const { data: item } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const { data } = await rxsoftApi.get(`/items/${itemId}`);
      return data as ItemWithUoms | null;
    },
    enabled: !!itemId && opened,
  });

  const { data: priceListItems = [] } = useQuery({
    queryKey: ['price-list-items', itemId],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/price-lists/items', {
        params: { itemId, limit: 5 },
      });
      return (data?.data ?? data ?? []) as PriceListItem[];
    },
    enabled: !!itemId && opened,
  });

  const { data: allUoms = [] } = useQuery({
    queryKey: ['uoms', 'all'],
    queryFn: async () => {
      const { data } = await rxsoftApi.get('/uoms', { params: { limit: 100 } });
      return (data?.data ?? data ?? []) as UomData[];
    },
    staleTime: 300_000,
  });

  const baseUom = allUoms.find((u) => u.id === item?.baseUomId);
  const purchaseUom = allUoms.find((u) => u.id === item?.purchaseUomId);

  const conversionFactor = purchaseUom?.factor && baseUom?.factor
    ? purchaseUom.factor / baseUom.factor
    : null;

  const unitCost = conversionFactor && price > 0 ? price / conversionFactor : price;

  const firstPrice = priceListItems[0];

  return (
    <Modal opened={opened} onClose={onClose} title="Set Purchase Price" centered size="sm">
      <Stack>
        <Text size="sm">
          Item: <strong>{item?.purchaseUom?.name || item?.baseUom?.name || ''}</strong>
        </Text>

        {firstPrice && (
          <Text size="sm" c="dimmed">
            Current list price: {firstPrice.currencyCode} {firstPrice.unitPrice}
            {firstPrice.priceList ? ` (${firstPrice.priceList.name})` : ''}
          </Text>
        )}

        {purchaseUom && baseUom && purchaseUom.id !== baseUom.id && (
          <Text size="sm" c="dimmed">
            Purchase UOM: <strong>{purchaseUom.name}</strong> = {conversionFactor?.toFixed(4)} <strong>{baseUom.name}</strong>
          </Text>
        )}

        <NumberInput
          label="Price"
          description={purchaseUom && baseUom && purchaseUom.id !== baseUom.id
            ? `Price per ${purchaseUom.name} (stored as ${baseUom.name} equivalent)`
            : undefined
          }
          value={price}
          onChange={(v) => setPrice(Number(v) || 0)}
          decimalScale={4}
          min={0}
          step={0.01}
        />

        {purchaseUom && baseUom && purchaseUom.id !== baseUom.id && (
          <Text size="xs" c="gray">
            Unit cost per {baseUom.name}: {unitCost.toFixed(4)}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(unitCost)}>Confirm</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
