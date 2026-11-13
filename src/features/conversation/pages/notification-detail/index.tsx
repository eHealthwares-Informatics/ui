import { Badge, Box, Card, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { RxPage } from '@/components/page/rx-page';
import { conversationApi } from '@/lib/conversation-api';

type ResourceMeta = { title: string; endpoint: string; listPath: string };

/**
 * Read-only detail view for the conversation notification entities. The list
 * ID column links here in a new tab; the id is fetched by the backend GET /:id
 * route added for each entity.
 */
const RESOURCES: Record<string, ResourceMeta> = {
  'notification-templates': {
    title: 'Notification Template',
    endpoint: 'notification-templates',
    listPath: '/conversation/notification-templates',
  },
  'notification-dispatches': {
    title: 'Notification Dispatch',
    endpoint: 'notification-dispatches',
    listPath: '/conversation/notification-dispatches',
  },
  'notification-delivery': {
    title: 'Notification Delivery',
    endpoint: 'notification-deliveries',
    listPath: '/conversation/notification-delivery',
  },
  'notification-events': {
    title: 'Notification Event',
    endpoint: 'notification-events',
    listPath: '/conversation/notification-events',
  },
};

function humanize(key: string): string {
  if (key === 'id' || key === '_id') {
    return 'ID';
  }
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <Badge size="sm" variant="light" color={value ? 'green' : 'gray'}>
        {value ? 'Yes' : 'No'}
      </Badge>
    );
  }
  if (typeof value === 'string') {
    const date = /^\d{4}-\d{2}-\d{2}T/.test(value) ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
    return (
      <Text size="sm" style={{ wordBreak: 'break-word' }}>
        {value}
      </Text>
    );
  }
  if (typeof value === 'number') {
    return <Text size="sm">{String(value)}</Text>;
  }
  return (
    <Box
      component="pre"
      style={{
        margin: 0,
        maxHeight: 320,
        overflow: 'auto',
        fontSize: 11,
        whiteSpace: 'pre-wrap',
        textAlign: 'left',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}

export function RxNotificationDetailPage({ resource, id }: { resource: string; id: string }) {
  const navigate = useNavigate();
  const meta = RESOURCES[resource];

  // The list ID link carries the row's organisation so the backend can scope
  // the lookup (a super-admin has no ambient org on this route).
  const organizationId =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('organizationId')
      : null;

  const query = useQuery({
    queryKey: ['notification-detail', resource, id, organizationId],
    enabled: Boolean(meta),
    queryFn: async () => {
      const { data } = await conversationApi.get(`/${meta!.endpoint}/${id}`, {
        params: organizationId ? { organizationId } : undefined,
      });
      return (data?.data ?? data) as Record<string, unknown>;
    },
  });

  if (!meta) {
    return (
      <RxPage title="Notification Details" onBack={() => navigate({ to: '/conversation' })}>
        <Text size="sm" c="red">
          Unknown notification entity “{resource}”.
        </Text>
      </RxPage>
    );
  }

  const record = query.data ? { ...query.data, id: query.data.id ?? query.data._id } : undefined;

  return (
    <RxPage
      title={`${meta.title} Details`}
      breadcrumbs={[{ label: meta.title, href: meta.listPath }, { label: id }]}
      onBack={() => navigate({ to: meta.listPath })}
    >
      {query.isLoading && (
        <Text size="sm" c="dimmed">
          Loading {meta.title.toLowerCase()}…
        </Text>
      )}
      {query.isError && (
        <Text size="sm" c="red">
          Failed to load {meta.title.toLowerCase()}.
        </Text>
      )}
      {!query.isLoading && !query.isError && record && (
        <Card withBorder p="md">
          <Stack gap={0}>
            {Object.entries(record)
              .filter(([key]) => key !== '__v' && key !== '_id')
              .map(([key, value]) => (
                <Group
                  key={key}
                  gap="sm"
                  justify="space-between"
                  align="flex-start"
                  wrap="nowrap"
                  style={{
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                    padding: '8px 0',
                  }}
                >
                  <Text size="sm" c="dimmed" style={{ flex: '0 0 38%' }}>
                    {humanize(key)}
                  </Text>
                  <Box style={{ flex: 1, textAlign: 'right' }}>{renderValue(value)}</Box>
                </Group>
              ))}
          </Stack>
        </Card>
      )}
      {!query.isLoading && !query.isError && !record && (
        <Text size="sm" c="dimmed">
          Record not found.
        </Text>
      )}
    </RxPage>
  );
}
