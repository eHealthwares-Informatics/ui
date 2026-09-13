import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { RxPage } from '@/features/components/page/rx-page';
import { conversationApi } from '@/lib/conversation-api';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group gap="sm" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', padding: '8px 0' }}>
      <Text size="sm" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} style={{ textAlign: 'right' }}>{value}</Text>
    </Group>
  );
}

export function RxConversationDetailsPage({ conversationId }: { conversationId: string }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/conversations/${conversationId}`);
      return data;
    },
  });

  const conversation = query.data as Record<string, unknown> | undefined;

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'blue';
      case 'COMPLETED': return 'green';
      case 'STOPPED': return 'orange';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <RxPage
      title="Conversation Details"
      breadcrumbs={[
        { label: 'Conversations', href: '/conversation' },
        { label: conversationId.slice(0, 8) + '…' },
      ]}
      onBack={() => navigate({ to: '/conversation' })}
      actions={
        <Group>
          <Button variant="outline" onClick={() => navigate({ to: `/conversation/${conversationId}/edit` })}>
            Edit
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: '/conversation' })}>
            <ArrowLeft size={16} />
          </Button>
        </Group>
      }
    >
      {query.isLoading && <Text size="sm" c="dimmed">Loading conversation...</Text>}
      {query.isError && <Text size="sm" c="red">Failed to load conversation.</Text>}
      {!query.isLoading && !query.isError && conversation && (
        <Stack gap="md">
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Overview</Text>
            <Stack gap={0}>
              <DetailRow label="ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{conversationId}</Text>} />
              <DetailRow
                label="Status"
                value={<Badge color={statusColor(String(conversation.status ?? ''))} size="sm" variant="light">{String(conversation.status ?? '-')}</Badge>}
              />
              <DetailRow label="State" value={String(conversation.state ?? '-')} />
              <DetailRow label="Started At" value={conversation.startedAt ? new Date(conversation.startedAt as string).toLocaleString() : '-'} />
              <DetailRow label="Ended At" value={conversation.endedAt ? new Date(conversation.endedAt as string).toLocaleString() : '-'} />
            </Stack>
          </Card>

          <Card withBorder p="md">
            <Text fw={600} mb="xs">Questionnaire</Text>
            <Stack gap={0}>
              <DetailRow label="Questionnaire ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{String(conversation.questionnaireId ?? '-')}</Text>} />
              <DetailRow label="Channel ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{String(conversation.channelId ?? '-')}</Text>} />
              <DetailRow label="Current Question ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{String(conversation.currentQuestionId ?? '-')}</Text>} />
            </Stack>
          </Card>

          <Card withBorder p="md">
            <Text fw={600} mb="xs">Participants</Text>
            <Stack gap={0}>
              <DetailRow label="Host" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{String(conversation.hostParticipantId ?? '-')}</Text>} />
              <DetailRow label="Bot" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{String(conversation.botParticipantId ?? '-')}</Text>} />
            </Stack>
          </Card>

          {Boolean(conversation.context) && (
            <Card withBorder p="md">
              <Text fw={600} mb="xs">Context</Text>
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
                {JSON.stringify(conversation.context, null, 2)}
              </pre>
            </Card>
          )}
        </Stack>
      )}
    </RxPage>
  );
}
