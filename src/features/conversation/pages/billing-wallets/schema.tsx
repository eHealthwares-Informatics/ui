import { Badge, Text } from '@mantine/core';
import { EQUALS_WITH_OPTIONS, FILTERS, type Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { autocompleteField, optionValue, selectField } from '../../schemas/helpers';

export const OWNER_TYPE_OPTIONS = [
  { value: 'ORGANISATION', label: 'Organisation' },
  { value: 'CHANNEL', label: 'Channel' },
  { value: 'PARTICIPANT', label: 'Participant' },
];

const OWNER_TYPE_FILTER = EQUALS_WITH_OPTIONS(OWNER_TYPE_OPTIONS);

export type BillingChannelRef = {
  id: string;
  name?: string | null;
  code?: string | null;
  type?: string | null;
};

export type BillingOrganizationRef = {
  id: string;
  name?: string | null;
  code?: string | null;
};

export type BillingParticipantRef = {
  id: string;
  name?: string | null;
  userId?: string | null;
  email?: string | null;
};

const coins = (value: unknown) => `${Number(value ?? 0)}`;

/** Coin wallets (organisation / channel / participant) with manual credit. */
export function buildBillingWalletsConfig(args: {
  organizationId: string | null;
  isSuperAdmin?: boolean;
  onCredit: (row: Record<string, unknown>) => void;
  onEditWallet: (row: Record<string, unknown>) => void;
  channels?: BillingChannelRef[];
  organizations?: BillingOrganizationRef[];
  participants?: BillingParticipantRef[];
}): ModelConfig {
  const {
    organizationId,
    isSuperAdmin = false,
    onCredit,
    onEditWallet,
    channels = [],
    organizations = [],
    participants = [],
  } = args;

  const canEditRow = (row: Record<string, unknown>) => {
    if (isSuperAdmin) {
      return true;
    }
    return row.ownerType === 'ORGANISATION' && row.ownerId === organizationId;
  };

  const channelOptions: Option[] = channels.map((channel) => ({
    value: channel.id,
    label: `${channel.name ?? channel.code ?? channel.type ?? 'Channel'}${
      channel.code ? ` (${channel.code})` : ''
    }`,
  }));

  const organizationOptions: Option[] = organizations.map((org) => ({
    value: org.id,
    label: `${org.name ?? org.code ?? 'Organisation'}${org.code ? ` (${org.code})` : ''}`,
  }));

  const participantOptions: Option[] = participants.map((participant) => ({
    value: participant.id,
    label: `${
      participant.name ?? participant.userId ?? participant.email ?? 'Participant'
    }${participant.userId ? ` (${participant.userId})` : ''}`,
  }));

  // Owner options follow the selected owner type (organisation/channel/participant).
  const ownerOptionsFor = (ownerType: unknown): Option[] => {
    switch (String(ownerType ?? 'ORGANISATION')) {
      case 'CHANNEL':
        return channelOptions;
      case 'PARTICIPANT':
        return participantOptions;
      case 'ORGANISATION':
      default:
        return organizationOptions;
    }
  };

  const ownerOptions = ownerOptionsFor('ORGANISATION');

  const ownerLabel = (ownerType: unknown, ownerId: unknown) =>
    ownerOptionsFor(ownerType).find((item) => item.value === String(ownerId))?.label ??
    String(ownerId ?? '');

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
        render: (row) =>
          row.ownerId ? (
            <Text size="xs" ff="monospace">
              {ownerLabel(row.ownerType, row.ownerId)}
            </Text>
          ) : (
            <Text size="xs" c="dimmed">
              —
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
          {
            ...autocompleteField('ownerId', 'Owner', ownerOptions, 6, (formState) =>
              ownerOptionsFor(optionValue(formState.ownerType))
            ),
            required: true,
            placeholder: 'Search organisation, channel or participant',
          },
        ],
      },
    ],
    defaultState: {
      ownerType: 'ORGANISATION',
      ownerId: null,
    },
    buildCreatePayload: (values) => {
      const ownerType = optionValue(values.ownerType) ?? 'ORGANISATION';
      const ownerId = optionValue(values.ownerId) ?? '';
      const valid = ownerOptionsFor(ownerType).some((item) => item.value === ownerId);
      return {
        ownerType,
        ownerId: valid ? ownerId : null,
      };
    },
    defaultSort: { sortBy: 'updatedAt', sortOrder: 'desc' },
  };
}
