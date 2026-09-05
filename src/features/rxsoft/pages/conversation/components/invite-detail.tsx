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

const statusColor = (status?: string) => {
  switch (status) {
    case 'ACCEPTED': return 'green';
    case 'BROADCASTING': return 'blue';
    case 'AWAITING': return 'yellow';
    case 'TIMED_OUT': case 'CANCELLED': return 'red';
    default: return 'gray';
  }
};

function ConversationSection({ conversationId }: { conversationId: string }) {
  const convQuery = useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/conversations/${conversationId}`);
      return data;
    },
  });

  const conv = convQuery.data as Record<string, unknown> | undefined;
  const navigate = useNavigate();

  const convStatus = conv ? String(conv.status ?? '') : '';
  const convState = conv ? String(conv.state ?? '') : '';
  const qName = conv?.questionnaire
    ? String((conv.questionnaire as Record<string, unknown>)?.name ?? '-')
    : null;

  return (
    <Card withBorder p="md">
      <Text fw={600} mb="xs">Conversation</Text>
      {convQuery.isLoading ? (
        <Text size="sm" c="dimmed">Loading conversation...</Text>
      ) : convQuery.isError ? (
        <Text size="sm" c="red">Failed to load conversation.</Text>
      ) : conv ? (
        <Stack gap={0}>
          <DetailRow label="Conversation ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{conversationId}</Text>} />
          <DetailRow label="Status" value={<Badge color={convStatus === 'ACTIVE' ? 'green' : 'gray'} size="sm" variant="light">{convStatus || '-'}</Badge>} />
          <DetailRow label="State" value={convState || '-'} />
          {qName ? <DetailRow label="Questionnaire" value={qName} /> : null}
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">No conversation data</Text>
      )}
      <Button
        variant="subtle"
        size="xs"
        mt="xs"
        onClick={() => navigate({ to: `/conversation/${conversationId}/edit` })}
      >
        View Conversation →
      </Button>
    </Card>
  );
}

function ProvidersCard({ providers }: { providers: Record<string, unknown>[] }) {
  return (
    <Card withBorder p="md">
      <Text fw={600} mb="xs">Providers ({providers.length})</Text>
      {providers.length === 0 ? (
        <Text size="sm" c="dimmed">No providers assigned</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {providers.map((p, i) => {
            const pPhone = String(p.phone ?? '');
            const pRole = String(p.role ?? '');
            const pAccepted = String(p.accepted ?? '');
            const pFirst = String(p.firstName ?? '');
            const pLast = String(p.lastName ?? '');
            return (
              <Group
                key={i}
                gap="sm"
                justify="space-between"
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', padding: '8px 0' }}
              >
                <Text size="sm">{pFirst} {pLast}</Text>
                <Group gap="xs">
                  {pPhone ? <Text size="xs" c="dimmed">{pPhone}</Text> : null}
                  {pRole ? <Badge size="xs" variant="light">{pRole}</Badge> : null}
                  {pAccepted ? (
                    <Badge size="xs" color={pAccepted === 'true' ? 'green' : 'gray'} variant="light">
                      {pAccepted === 'true' ? 'Accepted' : 'Pending'}
                    </Badge>
                  ) : null}
                </Group>
              </Group>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function RxInviteDetailsPage({ inviteId }: { inviteId: string }) {
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['invites', inviteId],
    queryFn: async () => {
      const { data } = await conversationApi.get(`/invites/${inviteId}`);
      return data;
    },
  });

  const invite = query.data as Record<string, unknown> | undefined;
  const conversationId = invite?.conversationId ? String(invite.conversationId) : undefined;
  const providers = (Array.isArray(invite?.providers) ? invite.providers : []) as Record<string, unknown>[];

  const bStatus = invite ? String(invite.status ?? '') : '';
  const bChatMode = invite ? String(invite.chatMode) === 'true' : false;
  const bAcceptance = invite ? String(invite.acceptanceCount ?? '-') : '-';
  const bAccepted = invite ? String(invite.acceptedCount ?? 0) : '0';

  const timeoutAt = invite?.timeoutAt
    ? new Date(Number(invite.timeoutAt)).toLocaleString()
    : '—';
  const createdAt = invite?.createdAt
    ? new Date(invite.createdAt as string).toLocaleString()
    : '—';

  const convSection = conversationId ? <ConversationSection conversationId={conversationId} /> : null;

  const target = invite?.target as Record<string, unknown> | undefined;
  const hasTarget = target && Object.keys(target).length > 0;

  return (
    <RxPage
      title="Invite Details"
      breadcrumbs={[
        { label: 'Invites', href: '/conversation/invites' },
        { label: inviteId },
      ]}
      onBack={() => navigate({ to: '/conversation/invites' })}
      actions={
        <Button variant="outline" onClick={() => navigate({ to: '/conversation/invites' })}>
          <ArrowLeft size={16} />
        </Button>
      }
    >
      {query.isLoading && <Text size="sm" c="dimmed">Loading invite...</Text>}
      {query.isError && <Text size="sm" c="red">Failed to load invite.</Text>}
      {!query.isLoading && !query.isError && invite && (
        <Stack gap="md">
          {/* Overview */}
          <Card withBorder p="md">
            <Text fw={600} mb="xs">Overview</Text>
            <Stack gap={0}>
              <DetailRow label="ID" value={<Text size="xs" style={{ wordBreak: 'break-all' }}>{inviteId}</Text>} />
              <DetailRow
                label="Status"
                value={
                  <Badge color={statusColor(bStatus)} size="sm" variant="light">
                    {bStatus || '-'}
                  </Badge>
                }
              />
              <DetailRow label="Chat Mode" value={bChatMode ? 'Yes' : 'No'} />
              <DetailRow label="Required Acceptances" value={bAcceptance} />
              <DetailRow label="Accepted" value={bAccepted} />
              <DetailRow label="Timeout" value={timeoutAt} />
              <DetailRow label="Created" value={createdAt} />
            </Stack>
          </Card>

          {convSection}

          <ProvidersCard providers={providers} />

          {hasTarget && target && (
            <Card withBorder p="md">
              <Text fw={600} mb="xs">Target</Text>
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
                {JSON.stringify(target, null, 2)}
              </pre>
            </Card>
          )}

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
              {JSON.stringify(invite, null, 2)}
            </pre>
          </Card>
        </Stack>
      )}
    </RxPage>
  );
}
