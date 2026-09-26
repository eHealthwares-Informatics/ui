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
import { MasterItemSearch, type MasterItem } from '../shared/master-item-search';
import { LoincTestSearch, type LoincTest } from '../shared/loinc-test-search';
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
  /** Which catalogue the line was picked from. */
  itemKind?: 'STOCK_ITEM' | 'GENERIC_PRODUCT' | 'GENERIC_DRUG' | 'LOINC_TEST';
  /** Stable cross-system reference for the line (rxsoft + LIS). */
  referenceCode?: string;
  /** LOINC code when the line came from the lab test picker. */
  testDefinitionId?: string;
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
  visitId,
}: {
  onCreated?: (created?: Record<string, unknown>) => void;
  onClose: () => void;
  initialPatient?: PatientOption | null;
  submitUrl?: string;
  lockPatient?: boolean;
  /** Links the request to a visit (encounters/requests attach to visits). */
  visitId?: string;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient ?? null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [orderingProvider, setOrderingProvider] = useState<StaffOption | null>(null);
  const [itemRefs, setItemRefs] = useState<(MasterItem | null)[]>([null]);
  const [testRefs, setTestRefs] = useState<(LoincTest | null)[]>([null]);

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
          itemKind: item.itemKind || undefined,
          referenceCode: item.referenceCode || undefined,
          testDefinitionId: item.testDefinitionId || undefined,
        }));
      const { data } = await emrApi.post(submitUrl ?? '/requests', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        visitId: visitId || undefined,
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
      onCreated?.();
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

        <TextInput
          label="Diagnosis"
          placeholder="Working diagnosis"
          {...form.getInputProps('diagnosis')}
        />
        <Textarea
          label="Clinical notes"
          autosize
          minRows={2}
          {...form.getInputProps('clinicalNotes')}
        />

        <Divider label={`Items (${form.values.items.length})`} labelPosition="left" />

        {form.values.items.map((_, index) => (
          <Stack
            key={index}
            gap="xs"
            p="sm"
            style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 8 }}
          >
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                Item {index + 1}
              </Text>
              {form.values.items.length > 1 && (
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => {
                    form.removeListItem('items', index);
                    setItemRefs((prev) => prev.filter((_, i) => i !== index));
                    setTestRefs((prev) => prev.filter((_, i) => i !== index));
                  }}
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </ActionIcon>
              )}
            </Group>
            {form.values.requestType === 'LAB' ? (
              <LoincTestSearch
                label="Lab test (LOINC)"
                placeholder="Search LOINC tests…"
                value={testRefs[index] ?? null}
                onChange={(next) => {
                  setTestRefs((prev) => prev.map((ref, i) => (i === index ? next : ref)));
                  form.setFieldValue(`items.${index}.itemKind`, next ? 'LOINC_TEST' : undefined);
                  form.setFieldValue(
                    `items.${index}.testDefinitionId`,
                    next?.code ?? undefined,
                  );
                  form.setFieldValue(
                    `items.${index}.name`,
                    next ? `${next.name} (${next.code})` : form.values.items[index].name,
                  );
                  form.setFieldValue(`items.${index}.code`, next?.code ?? '');
                  form.setFieldValue(
                    `items.${index}.referenceCode`,
                    next ? `LOINC_TEST:${next.code}` : undefined,
                  );
                }}
              />
            ) : (
              <MasterItemSearch
                label="Item / Drug"
                placeholder="Search Stock, NDF or EMDEx catalogue…"
                value={itemRefs[index] ?? null}
                onChange={(next) => {
                  setItemRefs((prev) => prev.map((ref, i) => (i === index ? next : ref)));
                  setTestRefs((prev) => prev.map((ref, i) => (i === index ? null : ref)));
                  const referenceCode = next?.referenceCode;
                  form.setFieldValue(`items.${index}.itemKind`, next?.kind);
                  form.setFieldValue(`items.${index}.referenceCode`, referenceCode);
                  // Name + code concatenation: e.g. "Paracetamol 500mg — PMC-0001".
                  form.setFieldValue(
                    `items.${index}.name`,
                    next ? `${next.label} — ${next.code ?? next.id}` : form.values.items[index].name,
                  );
                  form.setFieldValue(`items.${index}.code`, next?.code ?? '');
                }}
              />
            )}              <TextInput
                label="Name"
                required
                placeholder="Item / test / medication name"
                description="Filled from the picker as name + code"
                {...form.getInputProps(`items.${index}.name`)}
              />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Code"
                placeholder="Item or LOINC code"
                {...form.getInputProps(`items.${index}.code`)}
              />
              <NumberInput
                label="Quantity"
                min={0}
                placeholder="0"
                {...form.getInputProps(`items.${index}.quantity`)}
              />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <TextInput
                label="Dose"
                placeholder="e.g. 500"
                {...form.getInputProps(`items.${index}.dose`)}
              />
              <TextInput
                label="Dose unit"
                placeholder="e.g. mg"
                {...form.getInputProps(`items.${index}.doseUnit`)}
              />
              <TextInput
                label="Frequency"
                placeholder="e.g. TDS"
                {...form.getInputProps(`items.${index}.frequency`)}
              />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Route"
                placeholder="e.g. Oral"
                {...form.getInputProps(`items.${index}.route`)}
              />
              <TextInput
                label="Instructions"
                placeholder="Special instructions"
                {...form.getInputProps(`items.${index}.instructions`)}
              />
            </SimpleGrid>
          </Stack>
        ))}          <Button
          variant="light"
          leftSection={<Plus size={15} />}
          onClick={() => {
            form.insertListItem('items', { ...EMPTY_ITEM });
            setItemRefs((prev) => [...prev, null]);
            setTestRefs((prev) => [...prev, null]);
          }}
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
