import { Badge, Box, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { Column } from '@/features/rxsoft/types';
import { ColumnTypeFilters, EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { useAuthStore } from '@/stores/auth-store';

type DeliveryRow = {
  id: string;
  eventKey: string | null;
  channelId: string | null;
  channelType: string | null;
  templateId: string | null;
  recipient: string | null;
  subject: string | null;
  body: string | null;
  status: string;
  error: string | null;
  isTest: boolean;
  createdAt: string;
  sentAt: string | null;
  providerMessageId: string | null;
  exchangeId: string | null;
  downstreamResponse: unknown;
};

function statusColor(status: string) {
  switch (status) {
    case 'sent':
      return 'green';
    case 'queued':
      return 'blue';
    case 'failed':
      return 'red';
    case 'disabled':
      return 'gray';
    default:
      return 'yellow';
  }
}

const statusFilter = EQUALS_WITH_OPTIONS([
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'queued', label: 'Queued' },
  { value: 'failed', label: 'Failed' },
  { value: 'disabled', label: 'Disabled' },
]);

const testFilter = EQUALS_WITH_OPTIONS([
  { value: 'true', label: 'Test' },
  { value: 'false', label: 'Event' },
]);

const columns: Column[] = [
  {
    key: 'createdAt',
    label: 'Time',
    sortable: true,
    filters: ColumnTypeFilters.DATE,
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
  },
  { key: 'eventKey', label: 'Event', sortable: true, filters: [FILTERS.CONTAINS] },
  {
    key: 'channelType',
    label: 'Channel',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => String(row.channelType ?? row.channelId ?? '—'),
  },
  { key: 'recipient', label: 'Recipient', filters: [FILTERS.CONTAINS] },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filters: statusFilter,
    render: (row) => (
      <Badge color={statusColor(String(row.status))} variant="light">
        {String(row.status)}
      </Badge>
    ),
  },
  {
    key: 'isTest',
    label: 'Kind',
    filters: testFilter,
    render: (row) => (
      <Badge color={row.isTest ? 'grape' : 'gray'} variant="light">
        {row.isTest ? 'Test' : 'Event'}
      </Badge>
    ),
  },
  {
    key: 'error',
    label: 'Result',
    render: (row) => {
      const text = row.error
        ? String(row.error)
        : row.downstreamResponse
          ? 'Responded'
          : row.status === 'pending'
            ? 'Awaiting send'
            : '—';
      return (
        <Text size="xs" c={row.error ? 'red' : 'dimmed'} lineClamp={1}>
          {text}
        </Text>
      );
    },
  },
];

export function RxNotificationDeliveryPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  const organizationId = useAuthStore((state) => state.selectedOrganisationId);

  const [detail, setDetail] = useState<DeliveryRow | null>(null);

  const config: ModelConfig = useMemo(
    () => ({
      id: 'notification-delivery',
      title: 'Notification Delivery',
      description: 'Read-only log of every notification send, fallback and skipped channel.',
      endpoint: '/notification-deliveries',
      apiProvider: conversationApi,
      listParamStyle: 'plain',
      queryKeyBase: ['notification-delivery', organizationId ?? 'global'],
      listParams: organizationId ? { organizationId } : {},
      columns,
      defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
      canCreate: false,
      canDelete: false,
      rowActions: [
        {
          label: 'View details',
          icon: Eye,
          onClick: (row) => setDetail(row as DeliveryRow),
        },
      ],
    }),
    [organizationId]
  );

  return (
    <Stack gap="lg">
      {!organizationId && isSuperAdmin ? (
        <Text c="dimmed" ta="center" py="xl">
          Select an organisation from the header to view its notification delivery log.
        </Text>
      ) : (
        <DataPageShell key={organizationId ?? 'global'} config={config} />
      )}

      <Modal
        opened={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Delivery details"
        centered
        size="lg"
      >
        {detail && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>{detail.eventKey ?? 'Ad-hoc channel send'}</Text>
              <Badge color={statusColor(detail.status)} variant="light">
                {detail.status}
              </Badge>
            </Group>
            <Paper withBorder p="sm" radius="sm">
              <Stack gap={4}>
                <Text size="xs" c="dimmed">
                  Channel
                </Text>
                <Text size="sm">{detail.channelType ?? detail.channelId ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  Recipient
                </Text>
                <Text size="sm">{detail.recipient ?? '—'}</Text>
                <Text size="xs" c="dimmed">
                  Created
                </Text>
                <Text size="sm">
                  {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : '—'}
                </Text>
              </Stack>
            </Paper>

            {detail.error && (
              <Paper withBorder p="sm" radius="sm">
                <Text size="xs" c="dimmed" mb={4}>
                  Error
                </Text>
                <Text size="sm" c="red">
                  {detail.error}
                </Text>
              </Paper>
            )}

            <Box
              component="pre"
              style={{
                margin: 0,
                maxHeight: 320,
                overflow: 'auto',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(
                {
                  providerMessageId: detail.providerMessageId,
                  exchangeId: detail.exchangeId,
                  downstreamResponse: detail.downstreamResponse,
                },
                null,
                2
              )}
            </Box>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
