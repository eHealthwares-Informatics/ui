import { Badge, Text } from '@mantine/core';
import { EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

const OWNER_TYPE_FILTER = EQUALS_WITH_OPTIONS([
  { value: 'ORGANISATION', label: 'Organisation' },
  { value: 'CHANNEL', label: 'Channel' },
  { value: 'PARTICIPANT', label: 'Participant' },
]);

const coins = (value: unknown) => `${Number(value ?? 0)}`;

/** Coin wallets (organisation / channel / participant) with manual credit. */
export function buildBillingWalletsConfig(args: {
  onCredit: (row: Record<string, unknown>) => void;
}): ModelConfig {
  return {
    id: 'billing-wallets',
    title: 'Wallets',
    description:
      'Coin balances for organisations, channels and participants. Credit a wallet to fund it manually.',
    endpoint: '/billing/wallets',
    listParamStyle: 'plain',
    queryKeyBase: ['billing-wallets'],
    apiProvider: conversationApi,
    canCreate: false,
    canDelete: false,
    canExport: false,
    columns: [
      {
        key: 'ownerType',
        label: 'Owner type',
        sortable: true,
        filters: OWNER_TYPE_FILTER,
        render: (row) => (
          <Badge size="xs" variant="light">
            {String(row.ownerType ?? '—')}
          </Badge>
        ),
      },
      {
        key: 'ownerId',
        label: 'Owner',
        filters: [FILTERS.CONTAINS],
        render: (row) => (
          <Text size="xs" ff="monospace">
            {String(row.ownerId ?? '—')}
          </Text>
        ),
      },
      {
        key: 'balanceCoins',
        label: 'Balance',
        sortable: true,
        render: (row) => (
          <Text size="sm" fw={600}>
            {coins(row.balanceCoins)} coins
          </Text>
        ),
      },
      {
        key: 'reservedCoins',
        label: 'Reserved',
        render: (row) => <Text size="sm">{coins(row.reservedCoins)} coins</Text>,
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
      },
    ],
    rowActions: [
      {
        id: 'credit',
        label: 'Credit coins',
        onClick: (row) => args.onCredit(row),
      },
    ],
    defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  };
}
