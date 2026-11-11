import { Badge, Text } from '@mantine/core';
import type { Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import {
  buildFields,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';

export type DispatchEventRow = { id: string; key: string; label: string };
export type DispatchTemplateRow = { id: string; code: string; name: string };
export type DispatchChannelRow = {
  id: string;
  label: string;
  type: string;
  enabled?: boolean;
};

const shortText = (value: unknown, fallback = '—') => (value ? String(value) : fallback);

/**
 * Dispatch rules: the join of an event, its template and the channel that
 * sends it, plus the optional fallback channel tried when the send fails.
 * Several rows for the same event/template/channel form a priority chain.
 */
export function buildNotificationDispatchesConfig(args: {
  organizationId: string | null;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  events?: DispatchEventRow[];
  templates?: DispatchTemplateRow[];
  channels?: DispatchChannelRow[];
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    events = [],
    templates = [],
    channels = [],
  } = args;

  const eventById = new Map(events.map((row) => [String(row.id), row]));
  const templateById = new Map(templates.map((row) => [String(row.id), row]));
  const channelById = new Map(channels.map((row) => [String(row.id), row]));

  const eventOptions: Option[] = events.map((row) => ({
    value: String(row.id),
    label: `${row.label || row.key} (${row.key})`,
  }));
  const templateOptions: Option[] = templates.map((row) => ({
    value: String(row.id),
    label: `${row.name || row.code} (${row.code})`,
  }));
  const channelOptions: Option[] = channels
    .filter((row) => row.enabled !== false)
    .map((row) => ({
      value: String(row.id),
      label: `${row.label} (${row.type})`,
    }));

  const eventOption = (id: unknown) => {
    const row = eventById.get(String(id ?? ''));
    return option(id, row ? `${row.label || row.key} (${row.key})` : undefined);
  };
  const templateOption = (id: unknown) => {
    const row = templateById.get(String(id ?? ''));
    return option(id, row ? `${row.name || row.code} (${row.code})` : undefined);
  };
  const channelOption = (id: unknown) => {
    const row = channelById.get(String(id ?? ''));
    return option(id, row ? `${row.label} (${row.type})` : undefined);
  };

  return withDefaultActions({
    id: 'notification-dispatches',
    title: 'Notification Dispatches',
    description:
      'Event + template + channel routing, with the fallback channel tried when a send fails.',
    endpoint: '/notification-dispatches',
    listParamStyle: 'plain',
    queryKeyBase: ['notification-dispatches', scopeKey],
    listParams: {
      ...scopeParams,
    },
    columns: [
      {
        key: 'eventId',
        label: 'Event',
        render: (row) => {
          const event = eventById.get(String(row.eventId ?? ''));
          return <Text size="sm">{event ? event.label || event.key : shortText(row.eventId)}</Text>;
        },
      },
      {
        key: 'templateId',
        label: 'Template',
        render: (row) => {
          const template = templateById.get(String(row.templateId ?? ''));
          return (
            <Text size="sm" ff="monospace">
              {template ? template.code : shortText(row.templateId)}
            </Text>
          );
        },
      },
      {
        key: 'channelId',
        label: 'Channel',
        render: (row) => {
          const channel = channelById.get(String(row.channelId ?? ''));
          return (
            <Badge size="xs" variant="light">
              {channel ? `${channel.label} (${channel.type})` : shortText(row.channelId)}
            </Badge>
          );
        },
      },
      {
        key: 'fallbackChannelId',
        label: 'Fallback channel',
        render: (row) => {
          const channel = channelById.get(String(row.fallbackChannelId ?? ''));
          if (!row.fallbackChannelId) {
            return (
              <Text size="xs" c="dimmed">
                —
              </Text>
            );
          }
          return (
            <Badge size="xs" variant="outline">
              {channel ? `${channel.label} (${channel.type})` : shortText(row.fallbackChannelId)}
            </Badge>
          );
        },
      },
      { key: 'priority', label: 'Priority', sortable: true },
      {
        key: 'enabled',
        label: 'Enabled',
        sortable: true,
        render: (row) => (
          <Badge size="xs" color={row.enabled === false ? 'gray' : 'green'} variant="light">
            {row.enabled === false ? 'Disabled' : 'Enabled'}
          </Badge>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        render: (row) => (
          <Text size="xs" c="dimmed" lineClamp={2} maw={320}>
            {String(row.description ?? '—')}
          </Text>
        ),
      },
    ],
    createFieldGroups: buildFields([
      {
        name: 'eventId',
        label: 'Event',
        type: 'autocomplete',
        options: eventOptions,
        col: 12,
      },
      selectField('templateId', 'Template', templateOptions, 12),
      selectField('channelId', 'Channel', channelOptions, 12),
      selectField('fallbackChannelId', 'Fallback channel', channelOptions, 12),
      {
        name: 'priority',
        label: 'Priority (lower runs first)',
        type: 'number',
        min: 0,
        step: 1,
        col: 6,
      },
      switchField('enabled', 'Enabled'),
      textField('description', 'Description', 12),
    ]),
    modalTitle: 'Notification dispatch',
    buildCreatePayload: (values) => ({
      organizationId: values.organizationId ?? organizationId ?? null,
      eventId: optionValue(values.eventId),
      templateId: optionValue(values.templateId),
      channelId: optionValue(values.channelId),
      fallbackChannelId: optionValue(values.fallbackChannelId) ?? null,
      priority: Number(values.priority ?? 0),
      description: String(values.description ?? '').trim() || null,
      enabled: values.enabled !== false,
    }),
    buildUpdatePayload: (values) =>
      pickUpdatePayload(values, {
        eventId: optionValue,
        templateId: optionValue,
        channelId: optionValue,
        fallbackChannelId: (value) => optionValue(value) ?? null,
        priority: (value) => Number(value ?? 0),
        description: (value) => String(value ?? '').trim() || null,
        enabled: (value) => value !== false,
      }),
    buildFormState: (row) => ({
      organizationId: row.organizationId ?? null,
      eventId: eventOption(row.eventId),
      templateId: templateOption(row.templateId),
      channelId: channelOption(row.channelId),
      fallbackChannelId: channelOption(row.fallbackChannelId),
      priority: Number(row.priority ?? 0),
      enabled: row.enabled !== false,
      description: text(row.description),
    }),
    defaultState: {
      organizationId,
      eventId: null,
      templateId: null,
      channelId: null,
      fallbackChannelId: null,
      priority: 0,
      enabled: true,
      description: '',
    },
    defaultSort: { sortBy: 'priority', sortOrder: 'asc' },
  });
}
