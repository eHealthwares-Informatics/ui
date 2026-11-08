import { Badge, Text } from '@mantine/core';
import { notifications as toast } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { ColumnDataType, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { retriggerNotificationDispatch } from '../notifications/api';

const ENDPOINT = '/notifications/dispatches';
const QUERY_KEY_BASE = ['rxsoft-data-page', ENDPOINT];

function statusColor(status: unknown) {
  switch (String(status ?? '')) {
    case 'SENT':
      return 'green';
    case 'PENDING':
      return 'blue';
    case 'PARTIAL':
      return 'yellow';
    case 'FAILED':
      return 'red';
    default:
      return 'gray';
  }
}

const columns: Column[] = [
  {
    key: 'createdAt',
    label: 'Time',
    dataType: ColumnDataType.DATETIME,
    render: (row) =>
      row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—',
  },
  { key: 'eventKey', label: 'Event' },
  {
    key: 'channelType',
    label: 'Channel',
    render: (row) => String(row.channelType ?? '—').toUpperCase(),
  },
  { key: 'recipientAddress', label: 'Recipient' },
  {
    key: 'subject',
    label: 'Subject',
    render: (row) => (
      <Text size="sm" lineClamp={1}>
        {String(row.subject ?? row.body ?? '—')}
      </Text>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <Badge color={statusColor(row.status)} variant="light">
        {String(row.status ?? 'PENDING')}
      </Badge>
    ),
  },
  {
    key: 'relatedEntity',
    label: 'Related',
    render: (row) =>
      row.relatedEntityId
        ? `${String(row.relatedEntityType ?? 'Entity')}: ${String(row.relatedEntityId).slice(0, 8)}…`
        : '—',
  },
  {
    key: 'error',
    label: 'Result',
    render: (row) => (
      <Text size="xs" c={row.error ? 'red' : 'dimmed'} lineClamp={1}>
        {row.error
          ? String(row.error)
          : row.sentCount
            ? `${row.sentCount} sent`
            : String(row.status ?? '')}
      </Text>
    ),
  },
];

/**
 * EMR notification dispatch ledger — what EMR sent through the conversation
 * engine, with a per-row Retrigger button.
 */
export function EmrNotificationDispatchesPage() {
  const queryClient = useQueryClient();

  const config = useMemo<ModelConfig>(() => {
    const retrigger = async (row: Record<string, unknown>) => {
      const id = String(row.id ?? '');
      if (!id) {
        return;
      }
      try {
        const result = await retriggerNotificationDispatch(id);
        toast.show({
          message: result.ok
            ? `Notification re-sent (${result.sent} delivered)`
            : 'Retrigger attempted — no channel accepted the message',
          color: result.ok ? 'green' : 'yellow',
        });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Failed to retrigger notification';
        toast.show({ message, color: 'red' });
      }
    };

    return {
      id: 'emr-notification-dispatches',
      title: 'Notification Dispatches',
      description:
        'Every notification EMR sent through the conversation engine (SMS, WhatsApp, Email), with its delivery result. Use Retrigger to send it again.',
      endpoint: ENDPOINT,
      apiProvider: emrApi,
      listParamStyle: 'plain',
      queryKeyBase: QUERY_KEY_BASE,
      columns,
      canCreate: false,
      canDelete: false,
      canExport: false,
      defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
      rowActions: [
        {
          id: 'retrigger',
          label: 'Retrigger',
          icon: RefreshCw,
          onClick: retrigger,
        },
      ],
    };
  }, [queryClient]);

  return <DataPageShell config={config} />;
}
