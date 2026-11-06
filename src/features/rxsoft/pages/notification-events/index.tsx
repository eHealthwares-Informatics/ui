import {
  Badge,
  Box,
  Card,
  Group,
  Loader,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { getArrayPayload } from '@/features/components/utils';
import { EQUALS_WITH_OPTIONS, FILTERS } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';

type ChannelRow = {
  id: string;
  organizationId: string | null;
  label: string;
  type: string;
  enabled: boolean;
  fallbackChannelId: string | null;
};

type TemplateRow = {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  enabled: boolean;
};

type PrintTemplateRow = {
  id: string;
  code: string;
  name: string;
  kind: string;
  type?: string;
};

type EventRow = {
  id: string;
  organizationId: string | null;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  templateId: string | null;
  channelIds: string[];
  printTemplateId: string | null;
};

/** Selects store an Option object in form state; payloads need the raw value. */
function optionValue(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'object') {
    const option = value as { value?: unknown };
    return option.value == null ? null : String(option.value);
  }
  return String(value);
}

type OrgOption = { id: string; name: string; code?: string };

const VIEW_KEY = 'notification-events-view';

function channelLabel(channel: ChannelRow | undefined) {
  if (!channel) return '—';
  return `${channel.label} (${channel.type})`;
}

function EventChannelMatrix({
  channels,
  channelIds,
  onChange,
}: {
  channels: ChannelRow[];
  channelIds: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        Channels
      </Text>
      <Text size="xs" c="dimmed">
        Switch on to activate the channel for this event.
      </Text>
      {channels.length === 0 && (
        <Text size="xs" c="dimmed">
          No channels configured yet.
        </Text>
      )}
      {channels.map((channel) => {
        const active = channelIds.includes(channel.id);
        return (
          <Group key={channel.id} justify="space-between" wrap="nowrap">
            <Group gap="xs">
              <Text size="sm">{channel.label}</Text>
              <Badge size="xs" variant="light">
                {channel.type}
              </Badge>
              {channel.organizationId ? null : (
                <Badge size="xs" color="gray" variant="light">
                  global
                </Badge>
              )}
            </Group>
            <Switch
              aria-label={`Activate ${channel.label}`}
              checked={active}
              onChange={(event) => {
                const next = event.currentTarget.checked
                  ? [...channelIds, channel.id]
                  : channelIds.filter((id) => id !== channel.id);
                onChange(next);
              }}
            />
          </Group>
        );
      })}
    </Stack>
  );
}

export function RxNotificationEventsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'cards'>(() => {
    if (typeof window === 'undefined') return 'table';
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table';
  });

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const { data: organizations = [], isLoading: loadingOrganizations } = useQuery({
    queryKey: ['notification-events', 'organizations'],
    enabled: isSuperAdmin,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await identityApi.get('/organizations', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as OrgOption[];
    },
  });

  useEffect(() => {
    if (isSuperAdmin && !organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [isSuperAdmin, organizationId, organizations]);

  const canLoad = !isSuperAdmin || Boolean(organizationId);
  const scopeParams = isSuperAdmin && organizationId ? { organizationId } : {};

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ['notification-events', 'channels', organizationId],
    enabled: canLoad,
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-channels', {
        params: { ...scopeParams, includeGlobal: true },
      });
      return getArrayPayload(data) as ChannelRow[];
    },
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['notification-events', 'templates', organizationId],
    enabled: canLoad,
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-templates', {
        params: { ...scopeParams, includeGlobal: true },
      });
      return getArrayPayload(data) as TemplateRow[];
    },
  });

  const { data: printTemplates = [] } = useQuery({
    queryKey: ['notification-events', 'print-templates'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/templates', {
        params: { type: 'print', isActive: 'true', limit: 200 },
      });
      const rows = getArrayPayload(data) as PrintTemplateRow[];
      // Defensive: only surface print templates even if the API returns a
      // mixed list (older builds ignored the `type` filter).
      return rows.filter((row) => !row.type || row.type === 'print');
    },
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['notification-events', 'events', organizationId],
    enabled: canLoad,
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-events', {
        params: { ...scopeParams, includeGlobal: true },
      });
      return getArrayPayload(data) as EventRow[];
    },
  });

  const eventMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      await conversationApi.patch(`/notification-events/${id}`, {
        ...payload,
        ...(isSuperAdmin && organizationId ? { organizationId } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-events'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.code ? `${org.code} - ${org.name}` : org.name,
      })),
    [organizations]
  );

  const printTemplatePayload = (value: unknown) => {
    const id = optionValue(value);
    return {
      printTemplateId: id ?? null,
    };
  };

  const tableConfig: ModelConfig = useMemo(
    () => ({
      id: 'notification-events',
      title: 'Notification Events',
      description: 'Activate channels and choose the notification template for each event.',
      endpoint: '/notification-events',
      apiProvider: conversationApi,
      listParamStyle: 'plain',
      queryKeyBase: ['notification-events', organizationId ?? 'org'],
      listParams: {
        ...(isSuperAdmin && organizationId ? { organizationId } : {}),
        includeGlobal: true,
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
          render: (row) => (
            <Badge color={row.enabled === false ? 'gray' : 'green'} variant="light">
              {row.enabled === false ? 'Disabled' : 'Enabled'}
            </Badge>
          ),
        },
        {
          key: 'templateId',
          label: 'Template',
          filters: EQUALS_WITH_OPTIONS(
            templates.map((template) => ({
              value: template.id,
              label: `${template.name}${template.organizationId ? '' : ' (global)'}`,
            }))
          ),
          render: (row) =>
            templates.find((template) => template.id === row.templateId)?.name ?? '—',
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
              printTemplates.find((template) => template.id === row.printTemplateId)?.name ??
                '—'
            ),
        },
        {
          key: 'channelIds',
          label: 'Channels',
          render: (row) => {
            const ids = Array.isArray(row.channelIds) ? (row.channelIds as string[]) : [];
            return ids.length ? ids.length : '0';
          },
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
              name: 'templateId',
              label: 'Notification template',
              type: 'select',
              col: 6,
              options: templates.map((template) => ({
                value: template.id,
                label: `${template.name}${template.organizationId ? '' : ' (global)'}`,
              })),
            },
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
            { name: 'channelIds', label: 'Channels', type: 'hidden', defaultValue: [] },
          ],
        },
      ],
      defaultState: {
        organizationId: organizationId ?? null,
        key: '',
        label: '',
        description: '',
        enabled: true,
        templateId: null,
        printTemplateId: null,
        channelIds: [],
      },
      buildFormState: (row) => ({
        ...row,
        organizationId:
          'organizationId' in row ? (row.organizationId ?? null) : (organizationId ?? null),
        templateId: row.templateId
          ? {
              value: String(row.templateId),
              label:
                templates.find((template) => template.id === row.templateId)?.name ??
                String(row.templateId),
            }
          : null,
        printTemplateId: row.printTemplateId
          ? {
              value: String(row.printTemplateId),
              label:
                printTemplates.find((template) => template.id === row.printTemplateId)?.name ??
                String(row.printTemplateId),
            }
          : null,
        channelIds: Array.isArray(row.channelIds) ? row.channelIds : [],
      }),
      buildCreatePayload: (values) => ({
        organizationId:
          values.organizationId === null ? null : (values.organizationId ?? organizationId ?? null),
        key: String(values.key ?? '').trim(),
        label: String(values.label ?? '').trim(),
        description: values.description ? String(values.description) : null,
        enabled: values.enabled !== false,
        templateId: optionValue(values.templateId),
        ...printTemplatePayload(values.printTemplateId),
        channelIds: Array.isArray(values.channelIds) ? values.channelIds : [],
      }),
      buildUpdatePayload: (values, row) => {
        // `values` only carries the fields the user actually changed. Merge it
        // over the row before building the PATCH, otherwise a channel toggle
        // would blank the label, template and description.
        const merged = { ...(row ?? {}), ...values };
        return {
          organizationId:
            row && 'organizationId' in row
              ? (row.organizationId ?? null)
              : (organizationId ?? null),
          label: String(merged.label ?? '').trim(),
          description: merged.description ? String(merged.description) : null,
          enabled: merged.enabled !== false,
          templateId: optionValue(merged.templateId),
          ...printTemplatePayload(merged.printTemplateId),
          channelIds: Array.isArray(merged.channelIds) ? merged.channelIds : [],
        };
      },
      renderCreateExtras: ({ formState, updateField }) => (
        <EventChannelMatrix
          channels={channels}
          channelIds={Array.isArray(formState.channelIds) ? (formState.channelIds as string[]) : []}
          onChange={(ids) => updateField('channelIds', ids)}
        />
      ),
      defaultSort: { sortBy: 'key', sortOrder: 'asc' },
      renderHeaderActions: () => (
        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as 'table' | 'cards')}
          data={[
            { label: 'Table', value: 'table' },
            { label: 'Cards', value: 'cards' },
          ]}
        />
      ),
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
    }),
    [organizationId, channels, templates, printTemplates, isSuperAdmin, view]
  );

  return (
    <Stack gap="lg">
      {isSuperAdmin && (
        <Card withBorder radius="md" padding="lg">
          <Select
            label="Facility (organisation)"
            placeholder={loadingOrganizations ? 'Loading organisations…' : 'Select an organisation'}
            data={organizationOptions}
            value={organizationId}
            onChange={(value) => setOrganizationId(value ?? null)}
            searchable
            clearable
            disabled={loadingOrganizations}
            nothingFoundMessage="No organisations found"
          />
        </Card>
      )}

      {!canLoad && (
        <Text c="dimmed" ta="center" py="xl">
          Select an organisation to configure its notification events.
        </Text>
      )}

      {canLoad && (loadingChannels || loadingTemplates || (view === 'cards' && loadingEvents)) && (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      )}

      {canLoad && view === 'table' && (
        <DataPageShell key={organizationId ?? 'global'} config={tableConfig} />
      )}

      {canLoad && view === 'cards' && !loadingEvents && (
        <Stack gap="md">
          <Group justify="space-between" align="flex-end">
            <Box>
              <Title order={2}>Notification Events</Title>
              <Text c="dimmed" size="sm">
                Activate channels per event and pick the notification template it uses.
              </Text>
            </Box>
            <SegmentedControl
              value={view}
              onChange={(value) => setView(value as 'table' | 'cards')}
              data={[
                { label: 'Table', value: 'table' },
                { label: 'Cards', value: 'cards' },
              ]}
            />
          </Group>
          {events.length === 0 && (
            <Text c="dimmed" ta="center" py="xl">
              No notification events configured yet.
            </Text>
          )}
          {events.map((event) => {
            const template = templates.find((item) => item.id === event.templateId);
            return (
              <Paper
                key={event.id}
                withBorder
                radius="md"
                p="lg"
                data-testid={`notification-event-${event.key}`}
              >
                <Group justify="space-between" mb="sm" wrap="nowrap">
                  <Group gap="xs">
                    <CalendarDays size={18} />
                    <Box>
                      <Text fw={600}>{event.label}</Text>
                      <Text size="xs" c="dimmed">
                        {event.key}
                        {event.organizationId ? '' : ' · global default'}
                      </Text>
                    </Box>
                  </Group>
                  <Switch
                    aria-label={`Enable ${event.label}`}
                    checked={event.enabled}
                    onChange={(e) =>
                      eventMutation.mutate({
                        id: event.id,
                        payload: { enabled: e.currentTarget.checked },
                      })
                    }
                  />
                </Group>

                <Select
                  label="Notification template"
                  placeholder="Select a template"
                  data={templates.map((item) => ({
                    value: item.id,
                    label: `${item.name}${item.organizationId ? '' : ' (global)'}`,
                  }))}
                  value={event.templateId}
                  onChange={(value) =>
                    eventMutation.mutate({
                      id: event.id,
                      payload: { templateId: value ?? null },
                    })
                  }
                  searchable
                  clearable
                  mb="md"
                />

                {template && (
                  <Text size="xs" c="dimmed" mb="sm">
                    Using: {template.name}
                  </Text>
                )}

                <Select
                  data-testid={`notification-event-print-template-${event.key}`}
                  label="Print template"
                  placeholder="No printed document"
                  data={printTemplates.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.code})`,
                  }))}
                  value={event.printTemplateId}
                  onChange={(value) => {
                    eventMutation.mutate({
                      id: event.id,
                      payload: {
                        printTemplateId: value ?? null,
                      },
                    });
                  }}
                  searchable
                  clearable
                  mb="md"
                />

                <EventChannelMatrix
                  channels={channels}
                  channelIds={event.channelIds ?? []}
                  onChange={(ids) =>
                    eventMutation.mutate({ id: event.id, payload: { channelIds: ids } })
                  }
                />
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
