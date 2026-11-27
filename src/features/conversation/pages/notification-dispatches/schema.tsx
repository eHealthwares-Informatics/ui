import { Anchor, Badge, Group, Switch, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Play } from 'lucide-react';
import { CopyIdCell } from '@/components/table/sn-cell';
import type { Option } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  buildFields,
  jsonField,
  option,
  optionValue,
  pickUpdatePayload,
  selectField,
  switchField,
  text,
  textField,
  withDefaultActions,
} from '../../schemas/helpers';
import { notificationDetailHref } from '../notification-detail/link';
import { compactMatcher, normalizeMatcher, validateMatcher } from './matcher';

export type DispatchEventRow = { id: string; key: string; label: string };
export type DispatchTemplateRow = {
  id: string;
  code: string;
  name: string;
  organizationId?: string | null;
  /** Authored token list (HealthStack templates) used to build the test sample. */
  metadata?: { options?: string[] } & Record<string, unknown>;
  /** Channel bodies — their `{{tokens}}` complete the sample context. */
  bodies?: Record<string, { body?: string; subject?: string; html?: string } | undefined>;
};
export type DispatchChannelRow = {
  id: string;
  label: string;
  type: string;
  enabled?: boolean;
};

const shortText = (value: unknown, fallback = '—') => (value ? String(value) : fallback);

function DispatchEnabledSwitch({ row }: { row: Record<string, unknown> }) {
  const queryClient = useQueryClient();
  const enabled = row.enabled !== false;
  const organizationId = (row.organizationId as string | null | undefined) ?? null;

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      await conversationApi.patch(
        `/notification-dispatches/${String(row.id)}`,
        { enabled: next, organizationId },
        organizationId ? { params: { organizationId } } : undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-dispatches'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  return (
    <Group gap="xs" wrap="nowrap">
      <Switch
        size="sm"
        aria-label="Toggle dispatch"
        data-testid={`dispatch-enabled-${row.id}`}
        checked={enabled}
        disabled={mutation.isPending}
        onChange={(event) => mutation.mutate(event.currentTarget.checked)}
      />
      <Text size="xs" c="dimmed">
        {enabled ? 'Enabled' : 'Disabled'}
      </Text>
    </Group>
  );
}

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
  onTest?: (row: Record<string, unknown>) => void;
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    events = [],
    templates = [],
    channels = [],
    onTest,
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
        key: 'id',
        label: 'ID',
        render: (row) => <CopyIdCell value={row.id} testId={`dispatch-id-${row.id}`} />,
      },
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
          if (!row.templateId) {
            return (
              <Text size="sm" c="dimmed">
                —
              </Text>
            );
          }
          const href = notificationDetailHref('notification-templates', {
            id: row.templateId,
            organizationId: template?.organizationId ?? row.organizationId,
          });
          return (
            <Anchor
              href={href}
              target="_blank"
              rel="noreferrer"
              size="sm"
              ff="monospace"
              title={template ? `${template.name} (${template.code})` : String(row.templateId)}
            >
              {template ? template.code : shortText(row.templateId)}
            </Anchor>
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
      {
        key: 'matcher',
        label: 'Matcher',
        render: (row) => {
          const summary = compactMatcher(row.matcher);
          if (!summary) {
            return (
              <Text size="xs" c="dimmed">
                —
              </Text>
            );
          }
          return (
            <Text
              size="xs"
              ff="monospace"
              lineClamp={2}
              maw={280}
              title={JSON.stringify(row.matcher)}
            >
              {summary}
            </Text>
          );
        },
      },
      { key: 'priority', label: 'Priority', sortable: true },
      {
        key: 'enabled',
        label: 'Enabled',
        sortable: true,
        render: (row) => <DispatchEnabledSwitch row={row} />,
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
      {
        ...jsonField('matcher', 'Matcher (JSON)'),
        placeholder:
          '{\n  "path": "context.channel",\n  "operator": "eq",\n  "value": "WHATSAPP"\n}',
        validate: validateMatcher,
      },
    ]),
    modalTitle: 'Notification dispatch',
    buildCreatePayload: (values) => ({
      organizationId: values.organizationId ?? organizationId ?? null,
      eventId: optionValue(values.eventId),
      templateId: optionValue(values.templateId),
      channelId: optionValue(values.channelId),
      fallbackChannelId: optionValue(values.fallbackChannelId) ?? null,
      matcher: normalizeMatcher(values.matcher),
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
        matcher: (value) => normalizeMatcher(value),
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
      matcher: normalizeMatcher(row.matcher),
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
      matcher: null,
      priority: 0,
      enabled: true,
      description: '',
    },
    defaultSort: { sortBy: 'priority', sortOrder: 'asc' },
    copyRowIdOnSn: true,
    canDelete: false,
    rowActionsInline: true,
    rowActions: onTest
      ? [
          {
            id: 'test',
            label: 'Test',
            icon: Play,
            onClick: (row) => onTest(row),
          },
        ]
      : undefined,
  });
}
