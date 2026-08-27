import { Button, Group, Modal, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { ENCOUNTER_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { ReasonAutocomplete } from '../shared/reason-autocomplete';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';

export function EncounterForm({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated?: (record?: Record<string, unknown>) => void;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [provider, setProvider] = useState<StaffOption | null>(null);

  const form = useForm({
    initialValues: {
      encounterType: '',
      encounterDatetime: '',
      reason: '',
      notes: '',
    },
    validate: {
      encounterType: (value) => (value ? null : 'Encounter type is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      const { data } = await emrApi.post('/encounters', {
        patientId: patient.patientId,
        // patientName: patient.patientName || undefined,
        encounterType: values.encounterType,
        providerId: provider?.id ?? undefined,
        providerName: provider?.staffName || undefined,
        encounterDatetime: values.encounterDatetime || undefined,
        reason: values.reason || undefined,
        notes: values.notes || undefined,
      });
      return data;
    },
    onSuccess: (record) => {
      notifications.show({ message: 'Encounter recorded', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'encounters'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
      onCreated?.({ ...(record as Record<string, unknown>), patientName: patient?.patientName ?? null });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Record Encounter" size="lg" centered>
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
              label="Encounter type"
              required
              placeholder="Select type"
              data={toSelectData(ENCOUNTER_TYPES)}
              {...form.getInputProps('encounterType')}
            />
            <StaffPicker value={provider} onChange={setProvider} label="Provider" />
          </SimpleGrid>

          <TextInput
            label="Encounter date & time"
            type="datetime-local"
            {...form.getInputProps('encounterDatetime')}
          />

          <ReasonAutocomplete
            label="Reason"
            value={form.values.reason}
            onChange={(next) => form.setFieldValue('reason', next)}
            source={{ queryKey: ['emr', 'encounters', 'reasons'], endpoint: '/encounters' }}
            placeholder="Search previous reasons or type a presenting complaint"
          />
          <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />

          {patient && (
            <Text size="xs" c="dimmed">
              Recording encounter for {patient.patientId} — {patient.patientName}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Record &amp; Start Timer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
