import { Badge } from '@mantine/core';
import { Send } from 'lucide-react';
import type { Column, Field, Option } from '@/features/rxsoft/types';
import { EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export type ChannelType = 'whatsapp' | 'whatsapp_template' | 'sms' | 'sms_proxy' | 'email';

export type ChannelRow = {
  id: string;
  organizationId: string | null;
  label: string;
  type: ChannelType;
  code: string | null;
  enabled: boolean;
  fallbackChannelId: string | null;
  testStatus: 'success' | 'failure' | 'queued' | null;
  testRecipient: string | null;
  testMessage: string | null;
  testDownstreamMessage: string | null;
  testDownstreamResponse: unknown;
  testedAt: string | null;
};

export const CHANNEL_TYPES: Array<{ value: ChannelType; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'whatsapp_template', label: 'WhatsApp Template' },
  { value: 'sms', label: 'SMS' },
  { value: 'sms_proxy', label: 'SMS Proxy' },
  { value: 'email', label: 'Email' },
];

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  whatsapp: 'WhatsApp',
  whatsapp_template: 'WhatsApp Template',
  sms: 'SMS',
  sms_proxy: 'SMS Proxy',
  email: 'Email',
};

const enabledFilter = EQUALS_WITH_OPTIONS([
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
]);

const typeFilter = EQUALS_WITH_OPTIONS(
  CHANNEL_TYPES.map((type) => ({ value: type.value, label: type.label }))
);

function channelColumns(channels: ChannelRow[]): Column[] {
  return [
    { key: 'label', label: 'Label', sortable: true, filters: [FILTERS.CONTAINS, FILTERS.EQUALS] },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      filters: typeFilter,
      render: (row) => CHANNEL_TYPE_LABEL[row.type as ChannelType] ?? String(row.type),
    },
    { key: 'code', label: 'Code', sortable: true, filters: [FILTERS.CONTAINS] },
    {
      key: 'enabled',
      label: 'Enabled',
      filters: enabledFilter,
      render: (row) => (
        <Badge color={row.enabled === false ? 'gray' : 'green'} variant="light">
          {row.enabled === false ? 'Disabled' : 'Enabled'}
        </Badge>
      ),
    },
    {
      key: 'fallbackChannelId',
      label: 'Fallback',
      render: (row) =>
        row.fallbackChannelId
          ? (channels.find((channel) => channel.id === row.fallbackChannelId)?.label ??
            String(row.fallbackChannelId))
          : 'None',
    },
    {
      key: 'testedAt',
      label: 'Last test',
      sortable: true,
      render: (row) =>
        row.testedAt ? new Date(String(row.testedAt)).toLocaleString() : 'Not tested',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
    },
  ];
}

function optionValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    const option = value as Option;
    return option.value ?? null;
  }
  return String(value);
}

export function buildNotificationChannelsConfig(args: {
  channels: ChannelRow[];
  organizationId: string | null;
  canManageGlobal?: boolean;
  onTest: (row: ChannelRow) => void;
}): ModelConfig {
  const { channels, organizationId, canManageGlobal = false, onTest } = args;

  const fallbackOptions: Option[] = [
    { value: '', label: 'No fallback' },
    ...channels.map((channel) => ({
      value: channel.id,
      label: `${channel.label} (${CHANNEL_TYPE_LABEL[channel.type] ?? channel.type})`,
    })),
  ];

  const createFields: Field[] = [
    {
      name: 'organizationId',
      label: 'Organisation',
      type: 'hidden',
      defaultValue: organizationId,
    },
    {
      name: 'label',
      label: 'Label',
      required: true,
      col: 6,
      placeholder: 'e.g. Transactional SMS',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      col: 6,
      options: CHANNEL_TYPES.map((type) => ({ value: type.value, label: type.label })),
    },
    {
      name: 'code',
      label: 'Channel code',
      col: 6,
      placeholder: 'SMS_NBSMS',
    },
    {
      name: 'fallbackChannelId',
      label: 'Fallback channel',
      type: 'select',
      col: 6,
      options: fallbackOptions,
      placeholder: 'No fallback',
    },
    { name: 'enabled', label: 'Enabled', type: 'switch', col: 6, defaultValue: true },
  ];

  const buildCreatePayload = (values: Record<string, unknown>) => ({
    organizationId: values.organizationId ?? organizationId ?? null,
    label: String(values.label ?? '').trim(),
    type: optionValue(values.type) ?? 'sms',
    code: String(values.code ?? '').trim() || null,
    enabled: values.enabled !== false,
    fallbackChannelId: optionValue(values.fallbackChannelId),
  });

  const buildUpdatePayload = (values: Record<string, unknown>, row?: Record<string, unknown>) => {
    const scopeOrganizationId =
      row && 'organizationId' in row
        ? ((row.organizationId as string | null | undefined) ?? null)
        : (organizationId ?? null);
    const payload: Record<string, unknown> = {
      organizationId: scopeOrganizationId,
    };
    if (values.label !== undefined) payload.label = String(values.label).trim();
    if (values.type !== undefined) payload.type = optionValue(values.type);
    if (values.code !== undefined) payload.code = String(values.code).trim() || null;
    if (values.enabled !== undefined) payload.enabled = values.enabled !== false;
    if (values.fallbackChannelId !== undefined) {
      payload.fallbackChannelId = optionValue(values.fallbackChannelId);
    }
    return payload;
  };

  const buildFormState = (row: Record<string, unknown>) => {
    const type = row.type as ChannelType;
    return {
      organizationId:
        'organizationId' in row ? (row.organizationId ?? null) : (organizationId ?? null),
      label: row.label,
      type: type ? { value: type, label: CHANNEL_TYPE_LABEL[type] ?? type } : null,
      code: row.code ?? '',
      fallbackChannelId: row.fallbackChannelId
        ? {
            value: row.fallbackChannelId,
            label:
              channels.find((channel) => channel.id === row.fallbackChannelId)?.label ??
              String(row.fallbackChannelId),
          }
        : null,
      enabled: row.enabled !== false,
    };
  };

  return {
    id: 'notification-channels',
    title: 'Channels Config',
    description: 'Add, enable and test the channels used for patient notifications.',
    endpoint: '/notification-channels',
    apiProvider: conversationApi,
    listParamStyle: 'plain',
    queryKeyBase: ['notification-channels', organizationId ?? 'global'],
    listParams: {
      includeGlobal: true,
      ...(organizationId ? { organizationId } : {}),
    },
    columns: channelColumns(channels),
    createFields,
    modalTitle: 'Notification channel',
    buildCreatePayload,
    buildUpdatePayload,
    buildFormState,
    defaultState: {
      organizationId,
      label: '',
      type: { value: 'sms', label: 'SMS' },
      code: '',
      fallbackChannelId: null,
      enabled: true,
    },
    defaultSort: { sortBy: 'label', sortOrder: 'asc' },
    canDelete: true,
    canDeleteRow: (row) => canManageGlobal || row.organizationId != null,
    deletePathBuilder: (row) =>
      `/notification-channels/${row.id}${
        row.organizationId
          ? `?organizationId=${encodeURIComponent(String(row.organizationId))}`
          : ''
      }`,
    rowActions: [
      {
        label: 'Test message',
        icon: Send,
        onClick: (row) => onTest(row as ChannelRow),
      },
    ],
  };
}
