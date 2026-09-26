import { ActionIcon, Group, NumberInput, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function InlinePriceCell({ row }: { row: Record<string, unknown> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string | number>(row.unitPrice as number);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newPrice: number) =>
      rxsoftApi.patch(`/price-lists/${row.priceListId}/items/${row.id}`, {
        unitPrice: newPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rxsoft-data-page', '/price-lists/items'] });
      setEditing(false);
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  if (editing) {
    return (
      <Group gap={4}>
        <NumberInput
          value={value}
          onChange={(v) => setValue(v)}
          size="xs"
          style={{ width: 90 }}
          min={0}
          step={0.01}
          decimalScale={2}
          fixedDecimalScale
        />
        <ActionIcon size="sm" color="green" onClick={() => mutation.mutate(Number(value))} loading={mutation.isPending}>
          <Check size={14} />
        </ActionIcon>
        <ActionIcon size="sm" color="gray" onClick={() => { setEditing(false); setValue(row.unitPrice as number); }}>
          <X size={14} />
        </ActionIcon>
      </Group>
    );
  }

  return (
    <Text
      size="sm"
      onDoubleClick={() => setEditing(true)}
      style={{ cursor: 'pointer' }}
      td={mutation.isPending ? 'underline' : undefined}
    >
      {Number(row.unitPrice).toLocaleString('en-US', {
        style: 'currency',
        currency: (row.currencyCode as string) || 'NGN',
      })}
    </Text>
  );
}
