import { Badge, Text } from '@mantine/core';
import { RefreshCw } from 'lucide-react';
import { ColumnDataType, type Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { rxsoftApi } from '@/lib/rxsoft-api';

export const NOTIFICATION_DISPATCHES_ENDPOINT = '/notifications/dispatches';
export const NOTIFICATION_DISPATCHES_QUERY_KEY = [
  'rxsoft-data-page',
  NOTIFICATION_DISPATCHES_ENDPOINT,
];

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
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
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
 * RxSoft notification dispatch ledger — every event RxSoft sent through the
 * conversation engine, with a per-row Retrigger button.
 */
export function buildNotificationDispatchesConfig(args: {
  onRetrigger: (row: Record<string, unknown>) => void | Promise<void>;
}): ModelConfig {
  return {
    id: 'notification-dispatches',
    title: 'Notification Dispatches',
    description:
      'Every notification RxSoft sent through the conversation engine (orders, payments, refills, campaigns), with its delivery result. Use Retrigger to send it again.',
    endpoint: NOTIFICATION_DISPATCHES_ENDPOINT,
    apiProvider: rxsoftApi,
    superAdminOrgFilter: true,
    queryKeyBase: NOTIFICATION_DISPATCHES_QUERY_KEY,
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
        onClick: args.onRetrigger,
      },
    ],
  };
}
