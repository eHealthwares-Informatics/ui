import {
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { ADMISSION_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Admission } from '../../lib/emr-types';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';

export function AdmissionForm({
  onCreated,
  onClose,
  initialPatient,
}: {
  onCreated?: (admission?: Admission) => void;
  onClose: () => void;
  initialPatient?: PatientOption | null;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient ?? null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [referringProvider, setReferringProvider] = useState<StaffOption | null>(null);

  const { data: wards = [] } = useQuery({
    queryKey: ['emr', 'wards'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/wards', {
        params: { limit: 100 },
      });
      return res.data.data;
    },
  });

  const form = useForm({
    initialValues: {
      wardId: '',
      bedId: '',
      admissionType: 'ELECTIVE',
      admissionDatetime: '',
      diagnosis: '',
      notes: '',
    },
  });

  const selectedWardId = form.values.wardId;

  const { data: beds = [] } = useQuery({
    queryKey: ['emr', 'beds', 'available', selectedWardId],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/beds', {
        params: { limit: 100, wardId: selectedWardId || undefined, status: 'AVAILABLE' },
      });
      return res.data.data;
    },
    enabled: Boolean(selectedWardId),
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      const { data } = await emrApi.post<Admission>('/admissions', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        wardId: values.wardId || undefined,
        bedId: values.bedId || undefined,
        admissionType: values.admissionType,
        admissionDatetime: values.admissionDatetime || undefined,
        diagnosis: values.diagnosis.trim() || undefined,
        referringProviderId: referringProvider?.id ?? undefined,
        referringProviderName: referringProvider?.staffName || undefined,
        notes: values.notes.trim() || undefined,
      });
      return data;
    },
    onSuccess: (admission) => {
      notifications.show({ message: 'Patient admitted', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'admissions'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'beds'] });
      onCreated?.(admission);
      onClose();
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
            label="Ward"
            placeholder="Select ward"
            searchable
            clearable
            data={wards.map((ward) => ({
              value: String(ward.id),
              label: `${ward.code} — ${ward.name}`,
            }))}
            {...form.getInputProps('wardId')}
          />
          <Select
            label="Bed (available)"
            placeholder="Select bed"
            searchable
            clearable
            disabled={!selectedWardId}
            data={beds.map((bed) => ({
              value: String(bed.id),
              label: String(bed.code),
            }))}
            {...form.getInputProps('bedId')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Admission type"
            placeholder="Select type"
            data={toSelectData(ADMISSION_TYPES)}
            {...form.getInputProps('admissionType')}
          />
          <TextInput
            label="Admission date & time"
            type="datetime-local"
            {...form.getInputProps('admissionDatetime')}
          />
        </SimpleGrid>

        <StaffPicker value={referringProvider} onChange={setReferringProvider} label="Referring provider" />
        <TextInput label="Diagnosis" placeholder="Admission diagnosis (optional)" {...form.getInputProps('diagnosis')} />
        <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />

        {patient && (
          <Text size="xs" c="dimmed">
            Admitting {patient.patientId} — {patient.patientName}
          </Text>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Admit Patient
          </Button>
        </Group>
      </Stack>
    </form>
  );
}