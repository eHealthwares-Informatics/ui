import { Group, Switch, Text } from '@mantine/core';
import { EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';

export type PrintTemplateRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  type?: string;
};

export type EventRow = {
  id: string;
  organizationId: string | null;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  printTemplateId: string | null;
};

type EventMutator = {
  mutate: (variables: { id: string; payload: Record<string, unknown> }) => unknown;
};

/** Selects store an Option object in form state; payloads need the raw value. */
function optionValue(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'object') {
    const option = value as { value?: unknown };
    return option.value == null ? null : String(option.value);
  }
  return String(value);
}

function printTemplatePayload(value: unknown) {
  const id = optionValue(value);
  return {
    printTemplateId: id ?? null,
  };
}

export function buildNotificationEventsConfig(args: {
  organizationId: string | null | undefined;
  scopeKey?: string;
  scopeParams?: Record<string, string>;
  printTemplates: PrintTemplateRow[];
  isSuperAdmin: boolean;
  eventMutation: EventMutator;
}): ModelConfig {
  const {
    organizationId,
    scopeKey = organizationId ?? 'global',
    scopeParams = {},
    printTemplates,
    isSuperAdmin,
  } = args;
  const { eventMutation } = args;

  return {
    id: 'notification-events',
    title: 'Notification Events',
    description:
      'Notification events and their printed document template. Channel + template routing lives in Notification Dispatches.',
    endpoint: '/notification-events',
    apiProvider: conversationApi,
    listParamStyle: 'plain',
    queryKeyBase: ['notification-events', scopeKey],
    listParams: {
      ...scopeParams,
    },
    columns: [
      {
        key: 'key',
        label: 'Key',
        sortable: true,
        filters: [FILTERS.CONTAINS, FILTERS.EQUALS],
      },
      {
        key: 'label',
        label: 'Event',
        sortable: true,
        filters: [FILTERS.CONTAINS, FILTERS.EQUALS],
      },
      {
        key: 'description',
        label: 'Description',
        filters: [FILTERS.CONTAINS],
        render: (row) => (
          <Text size="xs" c="dimmed" lineClamp={2} maw={420}>
            {String(row.description ?? '—')}
          </Text>
        ),
      },
      {
        key: 'enabled',
        label: 'Enabled',
        sortable: true,
        filters: EQUALS_WITH_OPTIONS([
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ]),
        render: (row) => {
          const enabled = row.enabled !== false;
          return (
            <Group gap="xs" wrap="nowrap">
              <Switch
                size="sm"
                aria-label={`Enable ${String(row.label ?? row.key ?? 'event')}`}
                checked={enabled}
                disabled={!isSuperAdmin && row.organizationId == null}
                onChange={(event) =>
                  eventMutation.mutate({
                    id: String(row.id),
                    payload: { enabled: event.currentTarget.checked },
                  })
                }
              />
              <Text size="xs" c="dimmed">
                {enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </Group>
          );
        },
      },
      {
        key: 'printTemplateId',
        label: 'Print template',
        filters: EQUALS_WITH_OPTIONS(
          printTemplates.map((template) => ({
            value: template.id,
            label: `${template.name} (${template.code})`,
          }))
        ),
        render: (row) =>
          String(
            printTemplates.find((template) => template.id === row.printTemplateId)?.name ?? '—'
          ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        render: (row) => (row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : '—'),
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        sortable: true,
        render: (row) => (row.updatedAt ? new Date(String(row.updatedAt)).toLocaleString() : '—'),
      },
    ],
    createFieldGroups: [
      {
        title: 'Event',
        fields: [
          {
            name: 'organizationId',
            label: 'Organisation',
            type: 'hidden',
            defaultValue: organizationId,
          },
          { name: 'key', label: 'Key', type: 'text', required: true, col: 6 },
          { name: 'label', label: 'Label', type: 'text', required: true, col: 6 },
          { name: 'description', label: 'Description', type: 'textarea', col: 12 },
          { name: 'enabled', label: 'Enabled', type: 'switch', col: 6 },
          {
            name: 'printTemplateId',
            label: 'Print template',
            type: 'select',
            col: 12,
            options: printTemplates.map((template) => ({
              value: template.id,
              label: `${template.name} (${template.code})`,
            })),
            placeholder: 'No printed document',
          },
        ],
      },
    ],
    defaultState: {
      organizationId: organizationId ?? null,
      key: '',
      label: '',
      description: '',
      enabled: true,
      printTemplateId: null,
    },
    buildFormState: (row) => ({
      ...row,
      organizationId:
        'organizationId' in row ? (row.organizationId ?? null) : (organizationId ?? null),
      printTemplateId: row.printTemplateId
        ? {
            value: String(row.printTemplateId),
            label:
              printTemplates.find((template) => template.id === row.printTemplateId)?.name ??
              String(row.printTemplateId),
          }
        : null,
    }),
    buildCreatePayload: (values) => ({
      organizationId:
        values.organizationId === null ? null : (values.organizationId ?? organizationId ?? null),
      key: String(values.key ?? '').trim(),
      label: String(values.label ?? '').trim(),
      description: values.description ? String(values.description) : null,
      enabled: values.enabled !== false,
      ...printTemplatePayload(values.printTemplateId),
    }),
    buildUpdatePayload: (values, row) => {
      // `values` only carries the fields the user actually changed. Merge it
      // over the row before building the PATCH.
      const merged = { ...(row ?? {}), ...values };
      return {
        organizationId:
          row && 'organizationId' in row ? (row.organizationId ?? null) : (organizationId ?? null),
        label: String(merged.label ?? '').trim(),
        description: merged.description ? String(merged.description) : null,
        enabled: merged.enabled !== false,
        ...printTemplatePayload(merged.printTemplateId),
      };
    },
    defaultSort: { sortBy: 'key', sortOrder: 'asc' },
    canDelete: true,
    canDeleteRow: (row) => isSuperAdmin || row.organizationId != null,
    deletePathBuilder: (row) =>
      `/notification-events/${row.id}${
        row.organizationId
          ? `?organizationId=${encodeURIComponent(String(row.organizationId))}`
          : ''
      }`,
    permissions: {
      create: 'rxsoft.admin.settings.update',
      update: 'rxsoft.admin.settings.update',
      delete: 'rxsoft.admin.settings.update',
    },
  };
}
