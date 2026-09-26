import { ActionIcon, Anchor, Badge, Button, Group, Image, Modal, Select, Stack, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  PRESCRIPTION_STATUSES,
  prescriptionStatusColors,
  prescriptionsConfig,
} from './schema';
import type { Column } from '../../types';

type PrescriptionFile = {
  id: string;
  fileUrl: string;
  mime: string;
  originalName: string;
  size: number | null;
};

type PrescriptionRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  pharmacistNotes: string | null;
  adminNotes: string | null;
  files: PrescriptionFile[];
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge color={prescriptionStatusColors[status] ?? 'gray'} variant="light">
      {status}
    </Badge>
  );
}

function ViewFilesButton({ row }: { row: PrescriptionRow }) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Tooltip label="View files">
        <ActionIcon variant="light" onClick={() => setOpened(true)}>
          <Eye size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`Prescription files — ${row.name ?? row.id}`}
        size="lg"
      >
        <Stack gap="md">
          {(row.files?.length ?? 0) === 0 ? (
            <Text c="dimmed" size="sm">
              No files attached.
            </Text>
          ) : (
            row.files.map((file) => (
              <Stack key={file.id} gap={4}>
                <Group justify="space-between">
                  <Text size="sm" fw={500}>
                    {file.originalName}
                  </Text>
                  <Anchor
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    size="xs"
                  >
                    Open
                  </Anchor>
                </Group>
                {file.mime.startsWith('image/') ? (
                  <Image src={file.fileUrl} alt={file.originalName} radius="md" />
                ) : (
                  <Text size="xs" c="dimmed">
                    {file.mime} — open the file to view it.
                  </Text>
                )}
              </Stack>
            ))
          )}
        </Stack>
      </Modal>
    </>
  );
}

function ChangeStatusButton({ row }: { row: PrescriptionRow }) {
  const qc = useQueryClient();
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<string>(row.status);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.patch(
        `/website/admin/prescriptions/${row.id}/status`,
        { status },
      );
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
  const columns: Column[] = [
    ...prescriptionsConfig.columns,
    {
      key: 'files',
      label: 'Files',
      render: (row) => <ViewFilesButton row={row as unknown as PrescriptionRow} />,
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
      : column,
  );

  return <DataPageShell config={{ ...prescriptionsConfig, columns: withBadge }} />;
}
