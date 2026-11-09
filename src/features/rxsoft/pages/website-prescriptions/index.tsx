import { Badge, Button, Modal, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { rxsoftApi } from '@/lib/rxsoft-api';
import type { Column } from '../../types';
import { PRESCRIPTION_STATUSES, prescriptionStatusColors, prescriptionsConfig } from './schema';

type PrescriptionRow = {
  id: string;
  status: string;
  prescriberName: string | null;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge color={prescriptionStatusColors[status] ?? 'gray'} variant="light">
      {status}
    </Badge>
  );
}

function ChangeStatusButton({ row }: { row: PrescriptionRow }) {
  const qc = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<string>(row.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.patch(`/website/admin/prescriptions/${row.id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Prescription status updated', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
      setOpened(false);
    },
    onError: (err) => {
      notifications.show({
        color: 'red',
        message: getApiErrorMessage(err),
      });
    },
  });

  return (
    <>
      <Button size="compact-xs" variant="light" onClick={() => setOpened(true)}>
        Status
      </Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Update prescription status">
        <Stack gap="md">
          <Select
            label="Status"
            data={PRESCRIPTION_STATUSES.map((s) => ({ value: s, label: s }))}
            value={status}
            onChange={(v) => setStatus(v ?? 'Pending')}
            allowDeselect={false}
          />
          <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Save
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

export function RxWebsitePrescriptionsPage() {
  // The row "View" action (detailPathBuilder) opens the detail page, which
  // shows the files, workflow, transcription and medication lines.
  const columns: Column[] = [
    ...prescriptionsConfig.columns,
    {
      key: 'prescriberName',
      label: 'Prescriber',
      render: (row) => String(row.prescriberName ?? '—'),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => <ChangeStatusButton row={row as unknown as PrescriptionRow} />,
    },
  ];

  // Status column renders as a colored badge.
  const withBadge = columns.map((column) =>
    column.key === 'status'
      ? {
          ...column,
          render: (row: Record<string, unknown>) => (
            <StatusBadge status={String(row.status ?? '')} />
          ),
        }
      : column
  );

  return <DataPageShell config={{ ...prescriptionsConfig, columns: withBadge }} />;
}
