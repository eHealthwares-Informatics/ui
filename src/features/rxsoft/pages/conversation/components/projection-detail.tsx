import { Anchor, Badge, Button, Card, Group, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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

const idStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  background: 'var(--mantine-color-gray-0)',
  padding: '2px 6px',
  borderRadius: 4,
  border: '1px solid var(--mantine-color-gray-3)',
  wordBreak: 'break-all',
};

function IdLink({ id, to }: { id: string; to: string }) {
  const navigate = useNavigate();
  return (
    <Anchor
      component="button"
      size="xs"
      onClick={() => navigate({ to })}
      style={idStyle}
      title={id}
    >
      {id.length > 20 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id}
    </Anchor>
  );
}

const statusColor = (status?: string) => {
  switch (status) {
    case 'ACTIVE': return 'green';
    case 'PAUSED': return 'yellow';
    case 'ENDED': return 'red';
    default: return 'gray';
  }
};

export function RxProjectionDetailsPage({ projectionId }: { projectionId: string }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['projections', projectionId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/projections/${projectionId}`);
      return data;
    },
  });

  const proj = query.data as Record<string, unknown> | undefined;
  const participant = proj?.participant as Record<string, unknown> | undefined;
  const conversationId = proj?.conversationId ? String(proj.conversationId) : undefined;
  const channelId = proj?.channelId ? String(proj.channelId) : undefined;
  const participantId = participant?.id ? String(participant.id) : participant?._id ? String(participant._id) : undefined;

  // Fetch the conversation for extra context
  const convQuery = useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/conversations/${conversationId}`);
      return data;
    },
    enabled: !!conversationId,
  });

  const conversation = convQuery.data as Record<string, unknown> | undefined;

  return (
    <RxPage
      title="Projection Details"
      breadcrumbs={[
        { label: 'Projections', href: '/conversation/projections' },
        { label: projectionId },
      ]}
      onBack={() => navigate({ to: '/conversation/projections' })}
      actions={
        <Button variant="outline" onClick={() => navigate({ to: '/conversation/projections' })}>
          <ArrowLeft size={16} />
        </Button>
      }
    >
      {query.isLoading && <Text size="sm" c="dimmed">Loading projection...</Text>}
      {query.isError && <Text size="sm" c="red">Failed to load projection.</Text>}
      {!query.isLoading && !query.isError && proj && (
        <Stack gap="md">
          {/* Participant Info */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Participant</Text>
            <Stack gap={0}>
              <DetailRow
                label="Name"
                value={[participant?.firstName, participant?.lastName].filter(Boolean).join(' ') || '-'}
              />
              <DetailRow label="Phone" value={String(participant?.phone ?? '-')} />
              <DetailRow label="Email" value={String(participant?.email ?? '-')} />
              <DetailRow label="Participant ID" value={participantId ? <IdLink id={participantId} to={`/conversation/participants`} /> : '-'} />
            </Stack>
          </Card>

          {/* Projection Details */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Projection</Text>
            <Stack gap={0}>
              <DetailRow label="Projection ID" value={<IdLink id={projectionId} to="/conversation/projections" />} />
              <DetailRow label="Role" value={String(proj.role ?? '-')} />
              <DetailRow
                label="Status"
                value={<Badge color={statusColor(String(proj.status))} size="sm" variant="light">{String(proj.status ?? '-')}</Badge>}
              />
              <DetailRow label="Primary" value={String(proj.isPrimary ?? false) === 'true' ? 'Yes' : 'No'} />
              <DetailRow label="Active" value={String(proj.active ?? true) !== 'false' ? 'Yes' : 'No'} />
              <DetailRow label="Priority" value={String(proj.priority ?? 0)} />
              <DetailRow label="Unread Count" value={String(proj.unreadCount ?? 0)} />
              <DetailRow label="Channel ID" value={channelId ? <IdLink id={channelId} to="/conversation/channels" /> : '-'} />
              {proj.externalThreadId ? (
                <DetailRow label="External Thread ID" value={<Text size="xs" style={idStyle}>{String(proj.externalThreadId)}</Text>} />
              ) : null}
            </Stack>
          </Card>

          {/* Conversation Context */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Conversation</Text>
            {conversationId ? (
              convQuery.isLoading ? (
                <Text size="sm" c="dimmed">Loading conversation...</Text>
              ) : convQuery.isError ? (
                <Text size="sm" c="red">Failed to load conversation.</Text>
              ) : conversation ? (
                <Stack gap={0}>
                  <DetailRow label="Conversation ID" value={conversationId ? <IdLink id={conversationId} to={`/conversation/${conversationId}/edit`} /> : '-'} />
                  <DetailRow label="Status" value={<Badge color={String(conversation.status ?? '') === 'ACTIVE' ? 'green' : 'gray'} size="sm" variant="light">{String(conversation.status ?? '-')}</Badge>} />
                  <DetailRow label="State" value={String(conversation.state ?? '-')} />
                  {conversation.questionnaire ? (
                    <DetailRow label="Questionnaire" value={String((conversation.questionnaire as Record<string, unknown>)?.name ?? '-')} />
                  ) : null}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">No conversation data</Text>
              )
            ) : (
              <Text size="sm" c="dimmed">No conversation linked</Text>
            )}

          </Card>

          {/* Last Message */}              {(proj.lastMessageText || proj.lastMessageAt) ? (
            <Card withBorder p="md">
              <Text fw={600} mb="xs">Last Message</Text>
              <Stack gap={0}>
                {proj.lastMessageText ? (
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {String(proj.lastMessageText)}
                  </Text>
                ) : null}
                {proj.lastMessageDirection ? (
                  <DetailRow label="Direction" value={String(proj.lastMessageDirection)} />
                ) : null}
                {proj.lastMessageAt ? (
                  <DetailRow label="At" value={String(proj.lastMessageAt)} />
                ) : null}
                {proj.lastQuestionId ? (
                  <DetailRow label="Question ID" value={<Text size="xs">{String(proj.lastQuestionId)}</Text>} />
                ) : null}
              </Stack>
            </Card>
          ) : null}

          {/* Exchanges */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Exchanges</Text>
            <Text size="sm" c="dimmed" mb="xs">
              View all message exchanges for this projection's conversation and channel.
            </Text>
            <Group gap="xs" wrap="wrap">
              {conversationId ? (
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<ExternalLink size={14} />}
                  onClick={() => navigate({ to: `/conversation/exchanges?conversationId=${conversationId}` })}
                >
                  By Conversation
                </Button>
              ) : null}
              {channelId ? (
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<ExternalLink size={14} />}
                  onClick={() => navigate({ to: `/conversation/exchanges?channelId=${channelId}` })}
                >
                  By Channel
                </Button>
              ) : null}
              {participantId ? (
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<ExternalLink size={14} />}
                  onClick={() => navigate({ to: `/conversation/exchanges?senderId=${participantId}` })}
                >
                  By Participant (Sender)
                </Button>
              ) : null}
              {participantId ? (
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<ExternalLink size={14} />}
                  onClick={() => navigate({ to: `/conversation/exchanges?receiverId=${participantId}` })}
                >
                  By Participant (Receiver)
                </Button>
              ) : null}
            </Group>
          </Card>

          {/* Raw Data */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Raw Data</Text>
            <pre
              style={{
                overflowX: 'auto',
                background: 'var(--mantine-color-gray-0)',
                padding: 12,
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-3)',
                fontSize: 12,
                maxHeight: 400,
              }}
            >
              {JSON.stringify(proj, null, 2)}
            </pre>
          </Card>
        </Stack>
      )}
    </RxPage>
  );
}
