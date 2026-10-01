import { Button, Group, Modal, NumberInput, Stack, Table, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { priceListKeys } from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  itemId: string;
  itemName: string;
  priceListId?: string;
  /** UOM selected in the POS row — the price entered is FOR this unit. */
  uomName?: string;
  /** Effective factor of the selected UOM (1 = base unit). */
  uomFactor?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface PriceListItem {
  id: string;
  priceListId: string;
  unitPrice: number;
  currencyCode: string;
  priceList?: { id: string; code: string; name: string } | null;
}

export function PosSetPriceModal({
  opened,
  onClose,
  onSaved,
  itemId,
  itemName,
  priceListId,
  uomName,
  uomFactor,
}: Props) {
  const qc = useQueryClient();
  const factor = uomFactor && uomFactor > 0 ? uomFactor : 1;
  const [price, setPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const { data: entries = [], isLoading } = useQuery<PriceListItem[]>({
    queryKey: priceListKeys.items(itemId),
    queryFn: async () => {
      if (!itemId) {
        return [];
      }
      const { data } = await rxsoftApi.get('/price-lists/items', {
        params: { itemId, limit: 100 },
      });
      return (data?.data ?? data ?? []) as PriceListItem[];
    },
    enabled: opened && !!itemId,
    staleTime: 30_000,
  });

  const existing = entries.find((e) => e.priceListId === priceListId);

  function open() {
    if (existing) {
      setPrice(round2(Number(existing.unitPrice) / factor));
    } else if (entries.length > 0) {
      setPrice(round2(Number(entries[0].unitPrice) / factor));
    } else {
      setPrice(0);
    }
  }

  useEffect(() => {
    if (opened) {
      open();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, existing?.id]);

  async function handleSave() {
    if (!itemId || price === null || Number(price) < 0) {
      return;
    }
    setSaving(true);
    // The cashier enters the price FOR the selected UOM; the price list stores
    // the base-unit price, so convert on save (POS display multiplies back by factor).
    const storedUnitPrice = round2(Number(price) / factor);
    try {
      if (existing) {
        await rxsoftApi.patch(`/price-lists/${existing.priceListId}/items/${existing.id}`, {
          unitPrice: storedUnitPrice,
        });
      } else if (priceListId) {
        await rxsoftApi.post('/price-lists/items', {
          priceListId,
          itemId,
          currencyCode: entries[0]?.currencyCode ?? 'NGN',
          unitPrice: storedUnitPrice,
        });
      } else {
        notifications.show({
          color: 'orange',
          message: 'No price list selected on this POS session.',
        });
        return;
      }
      notifications.show({
        message: `Price set to ${storedUnitPrice.toFixed(2)}${uomName ? ` per ${uomName}` : ''}`,
        color: 'green',
      });
      qc.invalidateQueries({ queryKey: ['price-list-items'] });
      onSaved();
      onClose();
    } catch (err: any) {
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Set Price - ${itemName}`} centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Price list prices for this item:
        </Text>

        {isLoading ? (
          <Text size="sm" c="dimmed">
            Loading prices...
          </Text>
        ) : entries.length === 0 ? (
          <Text size="sm" c="dimmed">
            No prices configured for this item yet.
          </Text>
        ) : (
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Price List</Table.Th>
                <Table.Th>Price</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((e) => (
                <Table.Tr
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setPrice(round2(Number(e.unitPrice) / factor))}
                >
                  <Table.Td>{e.priceList?.name ?? e.priceListId}</Table.Td>
                  <Table.Td>
                    {e.currencyCode} {round2(Number(e.unitPrice) / factor).toFixed(2)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {entries.length > 0 && (
          <Text size="xs" c="dimmed">
            Prices shown{uomName ? ` per ${uomName}` : ''} (base-unit list price
            {uomName ? ` ÷ ${factor}` : ''}).
          </Text>
        )}

        {uomName && (
          <TextInput
            label="Price for"
            value={`${uomName} (×${factor})`}
            disabled
            styles={{ input: { color: '#495057' } }}
          />
        )}

        <NumberInput
          label={`Unit Price${uomName ? ` (per ${uomName})` : ''}`}
          description={
            uomName ? 'Entered for the selected UOM; stored as base-unit price.' : undefined
          }
          value={price}
          onChange={(v) => setPrice(Number(v) || 0)}
          min={0}
          required
        />

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={price === null}>
            Save Price
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
