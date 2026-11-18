import { Badge, Group, Select, Switch, Text } from '@mantine/core';
import { Eye, RefreshCw } from 'lucide-react';
import { CopyIdCell } from '@/components/table/sn-cell';
import {
  ColumnTypeFilters,
  EQUALS_WITH_OPTIONS,
  FILTERS,
  type Column,
} from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export type DeliveryRow = {
  id: string;
  eventKey: string | null;
  channelId: string | null;
  channelType: string | null;
  templateId: string | null;
  recipient: string | null;
  subject: string | null;
  body: string | null;
  requestPayload: Record<string, unknown> | null;
  status: string;
  error: string | null;
  isTest: boolean;
  attempts: number;
  createdAt: string;
  sentAt: string | null;
  providerMessageId: string | null;
  exchangeId: string | null;
  /** Generated print artifacts: { a4?: url, pos?: url }. */
  prints?: Record<string, string> | null;
  cloudinaryUrl: string | null;
  awsUrl: string | null;
  localUrl: string | null;
  downstreamResponse: unknown;
};

export type ExchangeState = 'all' | 'has' | 'missing';

export function statusColor(status: string) {
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

function statusLabel(status: string, exchangeId: string | null) {
  if (status === 'sent' && !exchangeId) {
    return 'Sent — no exchange';
  }
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
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
    key: 'id',
    label: 'ID',
    render: (row) => <CopyIdCell value={row.id} testId={`delivery-id-${row.id}`} />,
  },
  { key: 'eventKey', label: 'Event', sortable: true, filters: [FILTERS.CONTAINS] },
  {
    key: 'channelType',
    label: 'Channel',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => (
      <Badge color="blue" variant="light">
        {String(row.channelType ?? '—').toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'channelId',
    label: 'Channel ID',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => <CopyIdCell value={row.channelId} testId={`delivery-channel-${row.id}`} />,
  },
  {
    key: 'recipient',
    label: 'Recipient',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => String(row.recipient ?? '—'),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filters: statusFilter,
    render: (row) => {
      const status = String(row.status);
      const hasExchange = Boolean(row.exchangeId);
      const missing = status === 'sent' && !hasExchange;
      return (
        <Badge
          color={missing ? 'yellow' : statusColor(status)}
          variant="light"
          title={missing ? 'Marked SENT but has no conversation exchange association' : undefined}
        >
          {statusLabel(status, row.exchangeId as string | null)}
        </Badge>
      );
    },
  },
  {
    key: 'isTest',
    label: 'Kind',
    sortable: true,
    filters: testFilter,
    render: (row) => (
      <Badge color={row.isTest ? 'grape' : 'gray'} variant="light">
        {row.isTest ? 'Test' : 'Event'}
      </Badge>
    ),
  },
  {
    key: 'templateId',
    label: 'Template',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => <CopyIdCell value={row.templateId} testId={`delivery-template-${row.id}`} />,
  },
  {
    key: 'attempts',
    label: 'Attempts',
    render: (row) => Number(row.attempts ?? 0),
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
        <Text size="xs" c={row.error ? 'red' : 'dimmed'} lineClamp={2} title={text} maw={260}>
          {text}
        </Text>
      );
    },
  },
  {
    key: 'createdAt',
    label: 'Time',
    sortable: true,
    filters: ColumnTypeFilters.DATE,
    render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
  },
];

export function buildNotificationDeliveryConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  failuresOnly: boolean;
  testsOnly: boolean;
  exchangeState: ExchangeState;
  onFailuresOnlyChange: (value: boolean) => void;
  onTestsOnlyChange: (value: boolean) => void;
  onExchangeStateChange: (value: ExchangeState) => void;
  onViewDetails: (row: DeliveryRow) => void;
  onRetrigger?: (row: DeliveryRow) => void;
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    failuresOnly,
    testsOnly,
    exchangeState,
    onFailuresOnlyChange,
    onTestsOnlyChange,
    onExchangeStateChange,
    onViewDetails,
    onRetrigger,
  } = args;

  return {
    id: 'notification-delivery',
    title: 'Notification Delivery',
    description: 'Read-only log of every notification send, fallback and skipped channel.',
    endpoint: '/notification-deliveries',
    apiProvider: conversationApi,
    listParamStyle: 'plain',
    queryKeyBase: ['notification-delivery', scopeKey],
    listParams: {
      ...scopeParams,
      ...(failuresOnly ? { status: 'failed' } : {}),
      ...(testsOnly ? { isTest: 'true' } : {}),
      ...(exchangeState === 'has' ? { exchangeId: 'present' } : {}),
      ...(exchangeState === 'missing' ? { exchangeId: 'absent' } : {}),
    },
    columns,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
    canCreate: false,
    canDelete: false,
    copyRowIdOnSn: true,
    renderHeaderActions: () => (
      <Group gap="md" wrap="nowrap">
        <Switch
          size="xs"
          label="Failures only"
          checked={failuresOnly}
          onChange={(event) => onFailuresOnlyChange(event.currentTarget.checked)}
        />
        <Switch
          size="xs"
          label="Tests only"
          checked={testsOnly}
          onChange={(event) => onTestsOnlyChange(event.currentTarget.checked)}
        />
        <Select
          size="xs"
          label="Exchange"
          data={[
            { value: 'all', label: 'All' },
            { value: 'has', label: 'Has exchange' },
            { value: 'missing', label: 'Missing exchange' },
          ]}
          value={exchangeState}
          onChange={(value) => onExchangeStateChange(value as ExchangeState)}
        />
      </Group>
    ),
    rowActionsInline: true,
    rowActions: [
      {
        label: 'View details',
        icon: Eye,
        onClick: (row) => onViewDetails(row as DeliveryRow),
      },
      ...(onRetrigger
        ? [
            {
              id: 'retrigger',
              label: 'Retrigger',
              icon: RefreshCw,
              onClick: (row: Record<string, unknown>) => onRetrigger(row as DeliveryRow),
            },
          ]
        : []),
    ],
  };
}
