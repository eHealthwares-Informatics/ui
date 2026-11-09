import { Badge, Text } from '@mantine/core';
import { EQUALS_WITH_OPTIONS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

const KIND_FILTER = EQUALS_WITH_OPTIONS([
  { value: 'EXCHANGE', label: 'Exchange' },
  { value: 'AI_USAGE', label: 'AI usage' },
  { value: 'LIFECYCLE', label: 'Lifecycle' },
  { value: 'NOTIFICATION', label: 'Notification' },
]);

const STATUS_FILTER = EQUALS_WITH_OPTIONS([
  { value: 'CHARGED', label: 'Charged' },
  { value: 'FAILED', label: 'Failed' },
]);

const coins = (value: unknown) => `${Number(value ?? 0)}`;

/** Read-only ledger of billing charges. */
export function buildBillingChargesConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
}): ModelConfig {
  const { organizationId, scopeKey = organizationId ?? 'global', scopeParams = {} } = args;

  return {
    id: 'billing-charges',
    title: 'Billing Charges',
    description:
      'Every charge posted by the billing engine, with the matched rule and wallet owner.',
    endpoint: '/billing/charges',
    listParamStyle: 'plain',
    queryKeyBase: ['billing-charges', scopeKey],
    listParams: {
      ...scopeParams,
    },
    apiProvider: conversationApi,
    canCreate: false,
    canDelete: false,
    canExport: false,
    columns: [
      {
        key: 'createdAt',
        label: 'Time',
        sortable: true,
        render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
      },
      {
        key: 'kind',
        label: 'Kind',
        filters: KIND_FILTER,
        render: (row) => (
          <Badge size="xs" variant="light">
            {String(row.kind ?? '—')}
          </Badge>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        filters: STATUS_FILTER,
        render: (row) => (
          <Badge size="xs" color={row.status === 'FAILED' ? 'red' : 'green'} variant="light">
            {String(row.status ?? '—')}
          </Badge>
        ),
      },
      {
        key: 'ownerId',
        label: 'Billed to',
        render: (row) => (
          <Text size="xs">
            {row.billTo ? `${String(row.billTo)} · ` : ''}
            <Text component="span" ff="monospace" size="xs">
              {String(row.ownerId ?? '—')}
            </Text>
          </Text>
        ),
      },
      {
        key: 'totalCoins',
        label: 'Total',
        sortable: true,
        render: (row) => (
          <Text size="sm" fw={600}>
            {coins(row.totalCoins)} coins
          </Text>
        ),
      },
      {
        key: 'baseCoins',
        label: 'Base',
        render: (row) => <Text size="sm">{coins(row.baseCoins)}</Text>,
      },
      {
        key: 'markupCoins',
        label: 'Markup',
        render: (row) => <Text size="sm">{coins(row.markupCoins)}</Text>,
      },
      {
        key: 'notificationTemplate',
        label: 'Template',
        render: (row) => (
          <Text size="xs" ff="monospace">
            {row.notificationTemplate ? String(row.notificationTemplate) : '—'}
          </Text>
        ),
      },
      {
        key: 'exchangeId',
        label: 'Exchange',
        render: (row) => (
          <Text size="xs" ff="monospace">
            {row.exchangeId ? String(row.exchangeId).slice(0, 12) : '—'}
          </Text>
        ),
      },
      {
        key: 'notificationId',
        label: 'Notification',
        render: (row) => (
          <Text size="xs" ff="monospace">
            {row.notificationId ? String(row.notificationId).slice(0, 12) : '—'}
          </Text>
        ),
      },
    ],
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  };
}
