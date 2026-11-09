import { Badge, Group, Select, Switch, Text } from '@mantine/core';
import { Eye } from 'lucide-react';
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

const shortId = (value: unknown) => {
  const id = String(value ?? '');
  if (!id) {
    return '—';
  }
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
};

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
    render: (row) => (
      <Text size="xs" ff="monospace" title={String(row.channelId ?? '')}>
        {shortId(row.channelId)}
      </Text>
    ),
  },
  {
    key: 'recipient',
    label: 'Recipient',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => String(row.recipient ?? '—'),
  },
  {
    key: 'subject',
    label: 'Subject',
    render: (row) => (
      <Text size="xs" lineClamp={1} title={String(row.subject ?? row.body ?? '')} maw={240}>
        {String(row.subject ?? row.body ?? '—')}
      </Text>
    ),
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
    render: (row) => (
      <Text size="xs" ff="monospace" title={String(row.templateId ?? '')}>
        {shortId(row.templateId)}
      </Text>
    ),
  },
  {
    key: 'exchangeId',
    label: 'Exchange',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => (
      <Group gap="xs" wrap="nowrap">
        <Badge color={row.exchangeId ? 'green' : 'gray'} variant="light" size="xs">
          {row.exchangeId ? 'Linked' : 'No exchange'}
        </Badge>
        <Text size="xs" ff="monospace" title={String(row.exchangeId ?? '')}>
          {shortId(row.exchangeId)}
        </Text>
      </Group>
    ),
  },
  {
    key: 'providerMessageId',
    label: 'Provider message',
    sortable: true,
    filters: [FILTERS.CONTAINS],
    render: (row) => (
      <Text size="xs" ff="monospace" title={String(row.providerMessageId ?? '')}>
        {shortId(row.providerMessageId)}
      </Text>
    ),
  },
  {
    key: 'attempts',
    label: 'Attempts',
    render: (row) => Number(row.attempts ?? 0),
  },
  {
    key: 'requestPayload',
    label: 'Request',
    render: (row) => {
      const payload = row.requestPayload as Record<string, unknown> | null | undefined;
      const text = payload && Object.keys(payload).length > 0 ? JSON.stringify(payload) : '—';
      return (
        <Text size="xs" ff="monospace" lineClamp={1} maw={220} title={text}>
          {text.length > 60 ? `${text.slice(0, 60)}…` : text}
        </Text>
      );
    },
  },
  {
    key: 'sentAt',
    label: 'Sent At',
    sortable: true,
    filters: ColumnTypeFilters.DATE,
    render: (row) => (row.sentAt ? new Date(String(row.sentAt)).toLocaleString() : '—'),
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
    rowActions: [
      {
        label: 'View details',
        icon: Eye,
        onClick: (row) => onViewDetails(row as DeliveryRow),
      },
    ],
  };
}
