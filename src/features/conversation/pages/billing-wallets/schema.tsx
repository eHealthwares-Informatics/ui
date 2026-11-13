import { Badge, Text } from '@mantine/core';
import { EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import {
  selectField,
  textField,
} from '../../schemas/helpers';

export const OWNER_TYPE_OPTIONS = [
  { value: 'ORGANISATION', label: 'Organisation' },
  { value: 'CHANNEL', label: 'Channel' },
  { value: 'PARTICIPANT', label: 'Participant' },
];

const OWNER_TYPE_FILTER = EQUALS_WITH_OPTIONS(OWNER_TYPE_OPTIONS);

const coins = (value: unknown) => `${Number(value ?? 0)}`;

/** Coin wallets (organisation / channel / participant) with manual credit. */
export function buildBillingWalletsConfig(args: {
  organizationId: string | null;
  isSuperAdmin?: boolean;
  onCredit: (row: Record<string, unknown>) => void;
  onEditWallet: (row: Record<string, unknown>) => void;
}): ModelConfig {
  const {
    organizationId,
    isSuperAdmin = false,
    onCredit,
    onEditWallet,
  } = args;

  const canEditRow = (row: Record<string, unknown>) => {
    if (isSuperAdmin) return true;
    if (row.ownerType === 'ORGANISATION' && row.ownerId === organizationId) {
      return true;
    }
    return false;
  };

  return {
    id: 'billing-wallets',
    title: 'Wallets',
    description:
      'Coin balances for organisations, channels and participants. Create wallets, credit them, or adjust balances.',
    endpoint: '/billing/wallets',
    listParamStyle: 'plain',
    queryKeyBase: ['billing-wallets'],
    apiProvider: conversationApi,
    canCreate: true,
    canDelete: false,
    canEditRow,
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
        render: (row) =>
          row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—',
      },
    ],
    rowActions: [
      {
        label: 'Credit',
        onClick: (row) => onCredit(row),
      },
      {
        label: 'Edit balance',
        onClick: (row) => onEditWallet(row),
      },
    ],
    createFieldGroups: [
      {
        fields: [
          selectField('ownerType', 'Owner type', OWNER_TYPE_OPTIONS, 6),
          textField('ownerId', 'Owner id', 6),
        ],
      },
    ],
    defaultState: {
      ownerType: 'ORGANISATION',
      ownerId: organizationId ?? '',
    },
    buildCreatePayload: (values) => ({
      ownerType: values.ownerType,
      ownerId: String(values.ownerId ?? '').trim(),
    }),
    defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  };
}
