import { Button, Group, Modal, NumberInput, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';

interface Props {
  opened: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  stockLocationId: string;
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

  useEffect(() => {
    if (opened) {
      setNewQty(currentQty);
    }
  }, [opened, currentQty]);

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      const delta = newQty - currentQty;
      if (delta === 0) {return;}

      await rxsoftApi.post('/inventory/adjust-quantity', {
        itemId,
        locationId: stockLocationId,
        deltaQuantity: delta,
        reason: 'POS stock adjustment',
        uomId: uomId || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ message: `Stock updated to ${newQty} ${uomName ?? ''}`, color: 'green' });
      onAdjusted();
      onClose();
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? err.message ?? 'Failed to adjust stock',
      });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title={`Set Stock Qty - ${itemName}`} centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Current stock: <Text span fw={600}>{currentQty}</Text>
          {uomName && <Text span> {uomName}</Text>}
        </Text>
        <Text size="xs" c="dimmed">
          Base units: {baseQty}
        </Text>

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
            disabled={newQty === currentQty}
          >
            Update Stock
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
