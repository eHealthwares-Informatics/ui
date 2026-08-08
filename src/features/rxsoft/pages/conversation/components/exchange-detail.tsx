import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { RxPage } from '@/features/components/page/rx-page';
import { conversationApi } from '@/lib/conversation-api';
import { ParticipantCell } from './participant-cell';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group gap="sm" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', padding: '8px 0' }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} style={{ textAlign: 'right' }}>{value}</Text>
    </Group>
  );
}

export function RxExchangeDetailsPage({ exchangeId }: { exchangeId: string }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['exchanges', exchangeId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/exchanges/${exchangeId}`);
      return data;
    },
  });

  const exchange = query.data as Record<string, unknown> | undefined;
  const channelId = exchange?.channelId ? String(exchange.channelId) : undefined;

  const channelQuery = useQuery({
    queryKey: ['channels', channelId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/channels/${channelId}`);
      return data;
    },
    enabled: !!channelId,
  });

  const channel = channelQuery.data as Record<string, unknown> | undefined;

  return (
    <RxPage
      title="Exchange Details"
      breadcrumbs={[
        { label: 'Exchanges', href: '/conversation/exchanges' },
        { label: exchangeId },
      ]}
      onBack={() => navigate({ to: '/conversation/exchanges' })}
      actions={
        <Button variant="outline" onClick={() => navigate({ to: '/conversation/exchanges' })}>
          <ArrowLeft size={16} />
        </Button>
      }
    >
      {query.isLoading && <Text size="sm" c="dimmed">Loading exchange...</Text>}
      {query.isError && <Text size="sm" c="red">Failed to load exchange.</Text>}
      {!query.isLoading && !query.isError && exchange && (
        <Stack gap="md">
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Overview</Text>
            <Stack gap={0}>
              <DetailRow label="ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{exchangeId}</Text>} />
              <DetailRow label="Channel" value={String(exchange.channelType ?? '-')} />
              <DetailRow label="Direction" value={String(exchange.direction ?? '-')} />
              <DetailRow
                label="Status"
                value={<Badge color={exchange.status === 'FAILED' ? 'red' : 'blue'} size="sm" variant="light">{String(exchange.status ?? '-')}</Badge>}
              />
              <DetailRow label="Message ID" value={<Text size="xs">{String(exchange.messageId ?? '-')}</Text>} />
              <DetailRow label="Conversation ID" value={<Text size="xs">{String(exchange.conversationId ?? '-')}</Text>} />
              <DetailRow label="Questionnaire Code" value={String(exchange.questionnaireCode ?? '-')} />
              <DetailRow label="Created At" value={String(exchange.createdAt ?? '-')} />
            </Stack>
          </Card>

          <Card withBorder p="md">
            <Text fw={600} mb="xs">Channel Config</Text>
            {channelId ? (
              channelQuery.isLoading ? (
                <Text size="sm" c="dimmed">Loading channel...</Text>
              ) : channelQuery.isError ? (
                <Text size="sm" c="red">Failed to load channel.</Text>
              ) : channel ? (
                <Stack gap={0}>
                  <DetailRow label="Channel ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{channelId}</Text>} />
                  <DetailRow label="Name" value={String(channel.name ?? '-')} />
                  <DetailRow label="Code" value={String(channel.code ?? '-')} />
                  <DetailRow label="Type" value={String(channel.type ?? exchange.channelType ?? '-')} />
                  <DetailRow label="Provider" value={String(channel.provider ?? '-')} />
                  {Boolean(channel.config) && Object.keys(channel.config as Record<string, unknown>).length > 0 && (
                    <Stack gap={4} mt="xs">
                      <Text size="sm" c="dimmed">Config</Text>
                      <pre
                        style={{
                          overflowX: 'auto',
                          background: 'var(--mantine-color-gray-0)',
                          padding: 12,
                          borderRadius: 8,
                          border: '1px solid var(--mantine-color-gray-3)',
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(channel.config, null, 2)}
                      </pre>
                    </Stack>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">No channel data</Text>
              )
            ) : (
              <Text size="sm" c="dimmed">No channel linked to this exchange</Text>
            )}
          </Card>

          <Card withBorder p="md">
            <Text fw={600} mb="xs">Participants</Text>
            <Stack gap={0}>
              <DetailRow label="Sender" value={<ParticipantCell participantId={String(exchange.senderId ?? '')} />} />
              <DetailRow label="Receiver" value={<ParticipantCell participantId={String(exchange.receiverId ?? '')} />} />
            </Stack>
          </Card>

          <Card withBorder p="md">
            <Text fw={600} mb="xs">Message</Text>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {String(exchange.message ?? '-')}
            </Text>          </Card>

          {Boolean(exchange.payload || exchange.result || exchange.context) && (
            <Card withBorder p="md">
              <Text fw={600} mb="xs">Payload &amp; Metadata</Text>
              <pre
                style={{
                  overflowX: 'auto',
                  background: 'var(--mantine-color-gray-0)',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--mantine-color-gray-3)',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(
                  {
                    payload: exchange.payload ?? {},
                    result: exchange.result ?? {},
                    context: exchange.context ?? {},
                  },
                  null,
                  2,
                )}
              </pre>
            </Card>
          )}
        </Stack>
      )}
    </RxPage>
  );
}
