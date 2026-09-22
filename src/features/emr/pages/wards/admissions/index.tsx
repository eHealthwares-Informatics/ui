import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { emrApi } from '@/lib/emr-api';
import { AdmissionForm } from '../../../components/wards/admission-form';
import { DischargeModal } from '../../../components/wards/discharge-modal';
import { getApiErrorMessage } from '../../../lib/emr-errors';
import type { Admission } from '../../../lib/emr-types';
import { admissionsConfig } from './schema';

export function AdmissionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [discharging, setDischarging] = useState<Admission | null>(null);
  const [transferring, setTransferring] = useState<Admission | null>(null);

  const { data: wards = [] } = useQuery({
    queryKey: ['emr', 'wards'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/wards', {
        params: { limit: 100 },
      });
      return res.data.data;
    },
  });
  const { data: beds = [] } = useQuery({
    queryKey: ['emr', 'beds'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/beds', {
        params: { limit: 300 },
      });
      return res.data.data;
    },
  });

  const wardLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const ward of wards) {
      map.set(String(ward.id), `${ward.code} — ${ward.name}`);
    }
    return map;
  }, [wards]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['emr', 'admissions'] });
    queryClient.invalidateQueries({ queryKey: ['emr', 'beds'] });
    queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
  };

  const dischargeMutation = useMutation({
    mutationFn: async ({
      id,
      dischargeType,
      dischargeSummary,
    }: {
      id: string;
      dischargeType: string;
      dischargeSummary: string;
    }) => {
      const { data } = await emrApi.post(`/admissions/${id}/discharge`, {
        dischargeType,
        dischargeSummary: dischargeSummary || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Patient discharged', color: 'teal' });
      setDischarging(null);
      invalidate();
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  const transferMutation = useMutation({
    mutationFn: async ({ id, wardId, bedId }: { id: string; wardId: string; bedId: string }) => {
      const { data } = await emrApi.post(`/admissions/${id}/transfer`, {
        wardId: wardId || undefined,
        bedId: bedId || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Admission transferred', color: 'teal' });
      setTransferring(null);
      invalidate();
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  const config = useMemo(
    () => ({
      ...admissionsConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={openCreate}>
          Admit Patient
        </Button>
      ),
      rowActions: [
        {
          label: 'Open Visit',
          onClick: (row: Record<string, unknown>) => {
            const visitId = String(row.visitId ?? '');
            if (visitId) {
              void navigate({ to: '/emr/visits/$visitId', params: { visitId } });
            } else {
              notifications.show({
                color: 'yellow',
                message: 'This admission has no linked visit (legacy record)',
              });
            }
          },
        },
        {
          label: 'Transfer',
          onClick: (row: Record<string, unknown>) => setTransferring(row as unknown as Admission),
        },
        {
          label: 'Discharge',
          onClick: (row: Record<string, unknown>) => setDischarging(row as unknown as Admission),
        },
      ],
    }),
    [openCreate]
  );

  return (
    <>
      <DataPageShell config={config as typeof admissionsConfig} />

      <Modal opened={createOpened} onClose={closeCreate} title="Admit Patient" size="lg" centered>
        <AdmissionForm onClose={closeCreate} />
      </Modal>

      <DischargeModal
        admission={discharging}
        onClose={() => setDischarging(null)}
        onConfirm={(values) => dischargeMutation.mutate({ id: discharging!.id, ...values })}
      />
      <TransferModal
        admission={transferring}
        wards={wards}
        beds={beds}
        wardLabel={wardLabel}
        onClose={() => setTransferring(null)}
        onConfirm={(values) => transferMutation.mutate({ id: transferring!.id, ...values })}
      />
    </>
  );
}

function TransferModal({
  admission,
  wards,
  beds,
  wardLabel,
  onClose,
  onConfirm,
}: {
  admission: Admission | null;
  wards: Array<Record<string, unknown>>;
  beds: Array<Record<string, unknown>>;
  wardLabel: Map<string, string>;
  onClose: () => void;
  onConfirm: (values: { wardId: string; bedId: string }) => void;
}) {
  const [wardId, setWardId] = useState<string>(String(admission?.wardId ?? ''));
  const [bedId, setBedId] = useState<string>(String(admission?.bedId ?? ''));
  const availableBeds = wardId
    ? beds.filter((bed) => String(bed.wardId) === wardId && String(bed.status) === 'AVAILABLE')
    : [];
  return (
    <Modal opened={Boolean(admission)} onClose={onClose} title="Transfer Admission" centered>
      <Stack gap="sm">
        <Select
          label="Destination ward"
          searchable
          clearable
          data={wards.map((ward) => ({
            value: String(ward.id),
            label: wardLabel.get(String(ward.id)) ?? String(ward.id),
          }))}
          value={wardId}
          onChange={(value) => {
            setWardId(value ?? '');
            setBedId('');
          }}
        />
        <Select
          label="Destination bed (available)"
          searchable
          clearable
          data={availableBeds.map((bed) => ({ value: String(bed.id), label: String(bed.code) }))}
          value={bedId}
          onChange={(value) => setBedId(value ?? '')}
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm({ wardId, bedId })}>Confirm Transfer</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
