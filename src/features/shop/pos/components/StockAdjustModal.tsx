import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useStockLocations } from '../../api/posApi';

interface Props {
  opened: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  stockLocationId?: string | null;
  currentQty: number;
  baseQty: number;
  onAdjusted: () => void;
  uomId?: string;
  uomName?: string;
}

export function StockAdjustModal({
  opened,
  onClose,
  itemId,
  itemName,
  stockLocationId,
  currentQty,
  baseQty,
  onAdjusted,
  uomId,
  uomName,
}: Props) {
  const [newQty, setNewQty] = useState<number>(currentQty);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    stockLocationId || null
  );
  const { data: stockLocations = [] } = useStockLocations();

  useEffect(() => {
    if (opened) {
      setNewQty(currentQty);
      setSelectedLocationId(stockLocationId || null);
    }
  }, [opened, currentQty, stockLocationId]);

  const effectiveLocationId = selectedLocationId ?? stockLocationId ?? '';

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      const delta = newQty - currentQty;
      if (delta === 0) {
        return;
      }

      await rxsoftApi.post('/inventory/adjust-quantity', {
        itemId,
        locationId: effectiveLocationId,
        deltaQuantity: delta,
        reason: 'POS stock adjustment',
        uomId: uomId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({
        message: `Stock updated to ${newQty} ${uomName ?? ''}`,
        color: 'green',
      });
      onAdjusted();
      onClose();
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(err),
      });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title={`Set Stock Qty - ${itemName}`} centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Current stock:{' '}
          <Text span fw={600}>
            {currentQty}
          </Text>
          {uomName && <Text span> {uomName}</Text>}
        </Text>
        <Text size="xs" c="dimmed">
          Base units: {baseQty}
        </Text>

        {!stockLocationId && (
          <Select
            label="Stock Location"
            placeholder="Select stock location"
            data={stockLocations.map((l) => ({ value: l.id, label: l.name }))}
            value={selectedLocationId}
            onChange={setSelectedLocationId}
            searchable
            nothingFoundMessage="No stock locations"
          />
        )}

        <NumberInput
          label={`New Quantity (${uomName ?? 'unit'})`}
          value={newQty}
          onChange={(v) => setNewQty(Number(v) || 0)}
          min={0}
          required
        />

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => adjustmentMutation.mutate()}
            loading={adjustmentMutation.isPending}
            disabled={newQty === currentQty || !effectiveLocationId}
          >
            Update Stock
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
