import { Button, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { toSelectData, ADMISSION_TYPES } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';

/**
 * Convert an ongoing visit into an inpatient admission: pick a ward + bed and
 * submit. The backend links the admission to the visit and flips it to
 * INPATIENT.
 */
export function AdmitFromVisitModal({
  opened,
  onClose,
  visitId,
  patientLabel,
  onAdmitted,
}: {
  opened: boolean;
  onClose: () => void;
  visitId: string;
  patientLabel: string;
  onAdmitted?: (admissionId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [wardId, setWardId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [admissionType, setAdmissionType] = useState<string>('ELECTIVE');
  const [diagnosis, setDiagnosis] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: wards = [] } = useQuery({
    queryKey: ['emr', 'wards'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/wards', {
        params: { limit: 100 },
      });
      return res.data.data;
    },
    enabled: opened,
  });

  const { data: beds = [] } = useQuery({
    queryKey: ['emr', 'beds'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/beds', {
        params: { limit: 300 },
      });
      return res.data.data;
    },
    enabled: opened,
  });

  const availableBeds = wardId
    ? beds.filter((bed) => String(bed.wardId) === wardId && String(bed.status) === 'AVAILABLE')
    : [];

  const admit = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post<{
        admission: Record<string, unknown>;
        visit: Record<string, unknown>;
      }>(`/admissions/from-visit/${visitId}`, {
        wardId: wardId || undefined,
        bedId: bedId || undefined,
        admissionType,
        diagnosis: diagnosis || undefined,
      });
      return data;
    },
    onSuccess: (data) => {
      notifications.show({ message: 'Patient admitted', color: 'teal' });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'admissions'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'beds'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
      onClose();
      onAdmitted?.(String(data.admission?.id ?? ''));
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Admit to ward — ${patientLabel}`}
      size="sm"
      centered
    >
      <Stack gap="sm">
        <Select
          label="Ward"
          placeholder="Select ward"
          clearable
          searchable
          data={wards.map((ward) => ({
            value: String(ward.id),
            label: `${ward.code} — ${ward.name}`,
          }))}
          value={wardId}
          onChange={(value) => {
            setWardId(value);
            setBedId(null);
          }}
        />
        <Select
          label="Bed (available)"
          placeholder={wardId ? 'Select bed' : 'Select a ward first'}
          clearable
          searchable
          disabled={!wardId}
          data={availableBeds.map((bed) => ({
            value: String(bed.id),
            label: String(bed.code),
          }))}
          value={bedId}
          onChange={setBedId}
        />
        <Select
          label="Admission type"
          data={toSelectData(ADMISSION_TYPES)}
          value={admissionType}
          onChange={(value) => setAdmissionType(value ?? 'ELECTIVE')}
        />
        <Textarea
          label="Diagnosis / reason (optional)"
          autosize
          minRows={2}
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.currentTarget.value)}
        />
        <Text size="xs" c="dimmed">
          The visit stays open — encounters, requests and comments continue on the same visit while
          the patient is admitted.
        </Text>
        {error ? (
          <Text c="red" size="sm">
            {error}
          </Text>
        ) : null}
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose} disabled={admit.isPending}>
            Cancel
          </Button>
          <Button loading={admit.isPending} onClick={() => admit.mutate()}>
            Admit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
