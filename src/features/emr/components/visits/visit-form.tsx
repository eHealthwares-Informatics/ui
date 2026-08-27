import { Button, Group, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { toSelectData, VISIT_TYPES } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';

export function VisitForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [provider, setProvider] = useState<StaffOption | null>(null);

  const form = useForm({
    initialValues: {
      visitType: 'OUTPATIENT',
      startDatetime: '',
    },
    validate: {
      visitType: (value) => (value ? null : 'Visit type is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      const { data } = await emrApi.post('/visits', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        visitType: values.visitType,
        providerId: provider?.id ?? undefined,
        providerName: provider?.staffName || undefined,
        startDatetime: values.startDatetime || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Visit started', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'dashboard'] });
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
          error={patientError}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Visit type"
            required
            placeholder="Select type"
            data={toSelectData(VISIT_TYPES)}
            {...form.getInputProps('visitType')}
          />
          <StaffPicker value={provider} onChange={setProvider} label="Provider" />
        </SimpleGrid>

        <TextInput
          label="Start date & time"
          type="datetime-local"
          {...form.getInputProps('startDatetime')}
        />

        {patient && (
          <Text size="xs" c="dimmed">
            Starting visit for {patient.patientId} — {patient.patientName}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Start Visit
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
