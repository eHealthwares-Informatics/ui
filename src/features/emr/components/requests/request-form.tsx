import {
  ActionIcon,
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { PRIORITIES, REQUEST_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';

type RequestItem = {
  name: string;
  code: string;
  dose: string;
  doseUnit: string;
  frequency: string;
  route: string;
  quantity: number | '';
  instructions: string;
};

const EMPTY_ITEM: RequestItem = {
  name: '',
  code: '',
  dose: '',
  doseUnit: '',
  frequency: '',
  route: '',
  quantity: '',
  instructions: '',
};

export function RequestForm({
  onCreated,
  onClose,
  initialPatient,
  submitUrl,
  lockPatient = false,
}: {
  onCreated: () => void;
  onClose: () => void;
  initialPatient?: PatientOption | null;
  submitUrl?: string;
  lockPatient?: boolean;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient ?? null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [orderingProvider, setOrderingProvider] = useState<StaffOption | null>(null);

  const form = useForm({
    initialValues: {
      requestType: '',
      priority: 'ROUTINE',
      diagnosis: '',
      clinicalNotes: '',
      requestedAt: '',
      items: [EMPTY_ITEM],
    },
    validate: {
      requestType: (value) => (value ? null : 'Request type is required'),
      items: {
        name: (value) => (value?.trim() ? null : 'Item name is required'),
      },
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      const items = values.items
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name,
          code: item.code || undefined,
          dose: item.dose || undefined,
          doseUnit: item.doseUnit || undefined,
          frequency: item.frequency || undefined,
          route: item.route || undefined,
          quantity:
            item.quantity === '' || item.quantity == null ? undefined : Number(item.quantity),
          instructions: item.instructions || undefined,
        }));
      const { data } = await emrApi.post(submitUrl ?? '/requests', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        requestType: values.requestType,
        priority: values.priority,
        orderingProviderId: orderingProvider?.id ?? undefined,
        orderingProviderName: orderingProvider?.staffName || undefined,
        diagnosis: values.diagnosis || undefined,
        clinicalNotes: values.clinicalNotes || undefined,
        requestedAt: values.requestedAt || undefined,
        items,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Clinical request created', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
      onCreated();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack gap="sm">
        <PatientPicker
          value={patient}
          onChange={(next) => {
            setPatient(next);
            if (next) {
              setPatientError(null);
            }
          }}
          required
          disabled={lockPatient}
          error={patientError}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Request type"
            required
            placeholder="Select type"
            data={toSelectData(REQUEST_TYPES)}
            {...form.getInputProps('requestType')}
          />
          <Select
            label="Priority"
            placeholder="Select priority"
            data={toSelectData(PRIORITIES)}
            {...form.getInputProps('priority')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <StaffPicker
            value={orderingProvider}
            onChange={setOrderingProvider}
            label="Ordering provider"
          />
          <TextInput
            label="Requested at"
            type="datetime-local"
            {...form.getInputProps('requestedAt')}
          />
        </SimpleGrid>

        <TextInput label="Diagnosis" placeholder="Working diagnosis" {...form.getInputProps('diagnosis')} />
        <Textarea label="Clinical notes" autosize minRows={2} {...form.getInputProps('clinicalNotes')} />

        <Divider label={`Items (${form.values.items.length})`} labelPosition="left" />

        {form.values.items.map((_, index) => (
          <Stack key={index} gap="xs" p="sm" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 8 }}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Item {index + 1}
              </Text>
              {form.values.items.length > 1 && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => form.removeListItem('items', index)}
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </ActionIcon>
              )}
            </Group>
            <TextInput
              label="Name"
              required
              placeholder="Item / test / medication name"
              {...form.getInputProps(`items.${index}.name`)}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Code" placeholder="Item or LOINC code" {...form.getInputProps(`items.${index}.code`)} />
              <NumberInput
                label="Quantity"
                min={0}
                placeholder="0"
                {...form.getInputProps(`items.${index}.quantity`)}
              />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <TextInput label="Dose" placeholder="e.g. 500" {...form.getInputProps(`items.${index}.dose`)} />
              <TextInput label="Dose unit" placeholder="e.g. mg" {...form.getInputProps(`items.${index}.doseUnit`)} />
              <TextInput label="Frequency" placeholder="e.g. TDS" {...form.getInputProps(`items.${index}.frequency`)} />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput label="Route" placeholder="e.g. Oral" {...form.getInputProps(`items.${index}.route`)} />
              <TextInput label="Instructions" placeholder="Special instructions" {...form.getInputProps(`items.${index}.instructions`)} />
            </SimpleGrid>
          </Stack>
        ))}

        <Button
          variant="light"
          leftSection={<Plus size={15} />}
          onClick={() => form.insertListItem('items', { ...EMPTY_ITEM })}
        >
          Add item
        </Button>

        {patient && (
          <Text size="xs" c="dimmed">
            Ordering for {patient.patientId} — {patient.patientName}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create Request
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
