import { Badge, Switch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { CHANNEL_TYPE_OPTIONS } from '../../schemas/constants';
import {
  asyncField,
  bool,
  buildFields,
  jsonField,
  jsonObject,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

const shortValue = (value: unknown) => {
  const id = String(value ?? '');
  if (!id) {
    return '—';
  }
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
};

const formatTimestamp = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : '—';

function ChannelActiveSwitch({ row }: { row: Record<string, unknown> }) {
  const queryClient = useQueryClient();
  const active = row.isActive !== false;
  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      await conversationApi.patch(`/channels/${String(row.id)}`, { isActive: next });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rxsoft-data-page', '/channels'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <Switch
      size="sm"
      aria-label={`Toggle ${String(row.name ?? 'channel')}`}
      checked={active}
      disabled={mutation.isPending}
      onChange={(event) => mutation.mutate(event.currentTarget.checked)}
    />
  );
}

export const channelsConfig: ModelConfig = withDefaultActions({
  id: 'channels',
  title: 'Channels',
  description: 'Manage delivery channels, providers, activation, and metadata.',
  endpoint: '/channels',
  columns: [
    { key: 'id', label: 'ID', render: (row) => shortValue(row.id) },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row) => (
        <Badge size="xs" variant="light">
          {String(row.type ?? '—')}
        </Badge>
      ),
    },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'provider', label: 'Provider' },
    { key: 'externalId', label: 'External ID', render: (row) => shortValue(row.externalId) },
    {
      key: 'pseudoParticipantId',
      label: 'Pseudo Participant',
      render: (row) => shortValue(row.pseudoParticipantId),
    },
    {
      key: 'isActive',
      label: 'Active',
      sortable: true,
      render: (row) => <ChannelActiveSwitch row={row} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row) => formatTimestamp(row.createdAt),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (row) => formatTimestamp(row.updatedAt),
    },
  ],
  createFieldGroups: buildFields([
    textField('name', 'Name'),
    selectField('type', 'Type', CHANNEL_TYPE_OPTIONS),
    textField('code', 'Code'),
    textField('provider', 'Provider'),
    textField('externalId', 'External ID'),
    asyncField('pseudoParticipantId', 'Pseudo Participant', '/participants', 'firstName'),
    switchField('isActive', 'Active'),
    jsonField('metadata', 'Metadata'),
    jsonField('config', 'Config'),
  ]),
  defaultState: {
    name: '',
    type: option('WEB'),
    code: '',
    provider: '',
    externalId: '',
    pseudoParticipantId: null,
    metadata: {},
    config: {},
    isActive: true,
  },
  buildFormState: (row) => ({
    name: text(row.name),
    type: option(row.type),
    code: text(row.code),
    provider: text(row.provider),
    externalId: text(row.externalId),
    pseudoParticipantId: option(row.pseudoParticipantId),
    metadata: jsonObject(row.metadata),
    config: jsonObject(row.config),
    isActive: bool(row.isActive, true),
  }),
  buildCreatePayload: (values) => ({
    name: text(values.name).trim(),
    type: optionValue(values.type),
    code: optionValue(values.code),
    provider: text(values.provider).trim() || undefined,
    externalId: text(values.externalId).trim() || undefined,
    pseudoParticipantId: optionValue(values.pseudoParticipantId) || undefined,
    metadata: jsonObject(values.metadata),
    config: jsonObject(values.config),
    isActive: bool(values.isActive, true),
  }),
  buildUpdatePayload: (values) =>
    pickUpdatePayload(values, {
      name: (v) => text(v).trim(),
      type: (v) => optionValue(v),
      code: (v) => optionValue(v),
      provider: (v) => text(v).trim() || undefined,
      externalId: (v) => text(v).trim() || undefined,
      pseudoParticipantId: (v) => optionValue(v) || undefined,
      metadata: (v) => jsonObject(v),
      config: (v) => jsonObject(v),
      isActive: (v) => bool(v, true),
    }),
});
