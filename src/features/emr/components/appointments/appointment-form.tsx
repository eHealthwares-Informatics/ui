import { Button, Group, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { APPOINTMENT_TYPES, PRIORITIES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { ReasonAutocomplete } from '../shared/reason-autocomplete';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';
import { LocationPicker } from '../shared/location-picker';

export function AppointmentForm({
  onCreated,
  onClose,
  initialPatient,
}: {
  onCreated: () => void;
  onClose: () => void;
  initialPatient?: PatientOption | null;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient ?? null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [provider, setProvider] = useState<StaffOption | null>(null);

  const form = useForm({
    initialValues: {
      appointmentType: '',
      date: '',
      startTime: '',
      endTime: '',
      priority: 'ROUTINE',
      reason: '',
      notes: '',
      scheduleLocation: '',
    },
    validate: {
      appointmentType: (value) => (value ? null : 'Appointment type is required'),
      date: (value) => (value ? null : 'Date is required'),
      startTime: (value) => (value ? null : 'Start time is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      const { data } = await emrApi.post('/appointments', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        appointmentType: values.appointmentType,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime || undefined,
        providerId: provider?.id ?? undefined,
        providerName: provider?.staffName || undefined,
        priority: values.priority,
        reason: values.reason || undefined,
        notes: values.notes || undefined,
        scheduleLocation: values.scheduleLocation || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Appointment scheduled', color: 'teal' });
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
            label="Appointment type"
            required
            placeholder="Select type"
            data={toSelectData(APPOINTMENT_TYPES)}
            {...form.getInputProps('appointmentType')}
          />
          <Select
            label="Priority"
            placeholder="Select priority"
            data={toSelectData(PRIORITIES)}
            {...form.getInputProps('priority')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Date" required type="date" {...form.getInputProps('date')} />
          <TextInput label="Start time" required type="time" {...form.getInputProps('startTime')} />
          <TextInput label="End time" type="time" {...form.getInputProps('endTime')} />
        </SimpleGrid>

        <StaffPicker value={provider} onChange={setProvider} label="Provider" />

        <LocationPicker
          value={form.values.scheduleLocation || null}
          onChange={(id) => form.setFieldValue('scheduleLocation', id ?? '')}
          label="Schedule location"
          placeholder="Search a location to schedule at"
        />

        <ReasonAutocomplete
          label="Reason"
          value={form.values.reason}
          onChange={(next) => form.setFieldValue('reason', next)}
          source={{ queryKey: ['emr', 'appointments', 'reasons'], endpoint: '/appointments' }}
        />
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />

        {patient && (
          <Text size="xs" c="dimmed">
            Scheduling for {patient.patientId} — {patient.patientName}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Schedule Appointment
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
