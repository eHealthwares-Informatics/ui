import {
  Button,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

export type MedicationRequestContext = {
  requestId: string;
  patientId: string;
  patientName: string | null;
};

export type MedicationRequestItem = {
  name: string;
  dose?: string | null;
  doseUnit?: string | null;
  route?: string | null;
  frequency?: string | null;
  duration?: string | null;
  durationUnit?: string | null;
  quantity?: number | null;
  instructions?: string | null;
};

export function CreateMedicationModal({
  opened,
  onClose,
  request,
  items,
}: {
  opened: boolean;
  onClose: () => void;
  request: MedicationRequestContext;
  items: MedicationRequestItem[];
}) {
  const queryClient = useQueryClient();
  const [itemIndex, setItemIndex] = useState('');
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState('');
  const [route, setRoute] = useState('');
  const [frequency, setFrequency] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (!opened) {
      setItemIndex('');
      setDose('');
      setDoseUnit('');
      setRoute('');
      setFrequency('');
      setQuantity('');
      setInstructions('');
    }
  }, [opened]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const idx = Number(itemIndex);
      const { data } = await emrApi.post('/medications', {
        requestId: request.requestId,
        itemIndex: idx,
        dose: dose || undefined,
        doseUnit: doseUnit || undefined,
        route: route || undefined,
        frequency: frequency || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        instructions: instructions || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Medication created from prescription', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'medications'] });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const canSubmit = itemIndex !== '';

  return (
    <Modal opened={opened} onClose={onClose} title="Create Medication" size="md" centered>
      <Stack gap="sm">
        <TextInput
          label="Patient"
          value={request.patientName ? `${request.patientName} (${request.patientId})` : request.patientId}
          readOnly
        />
        <NativeSelect
          label="Prescription item"
          data={[
            {
              value: '',
              label: items.length === 0 ? 'No prescription items' : 'Select item',
            },
            ...items.map((item, index) => ({
              value: String(index),
              label: `${index + 1}. ${item.name}${
                [item.dose, item.doseUnit].filter(Boolean).length
                  ? ` · ${[item.dose, item.doseUnit].filter(Boolean).join(' ')}`
                  : ''
              }`,
            })),
          ]}
          value={itemIndex}
          onChange={(e) => setItemIndex(e.currentTarget.value)}
        />
        <Group grow>
          <TextInput label="Dose (override)" value={dose} onChange={(e) => setDose(e.currentTarget.value)} />
          <TextInput
            label="Dose unit (override)"
            value={doseUnit}
            onChange={(e) => setDoseUnit(e.currentTarget.value)}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Route (override)"
            value={route}
            onChange={(e) => setRoute(e.currentTarget.value)}
          />
          <TextInput
            label="Frequency (override)"
            value={frequency}
            onChange={(e) => setFrequency(e.currentTarget.value)}
          />
        </Group>
        <Group grow>
          <TextInput
            label="Quantity (override)"
            value={quantity}
            onChange={(e) => setQuantity(e.currentTarget.value)}
          />
          <TextInput
            label="Instructions (override)"
            value={instructions}
            onChange={(e) => setInstructions(e.currentTarget.value)}
          />
        </Group>
        <Text size="xs" c="dimmed">
          Each prescription item can be converted once. Leave overrides blank to use the item values.
        </Text>
        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={createMutation.isPending}
            disabled={!canSubmit}
            onClick={() => createMutation.mutate()}
          >
            Create medication
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
