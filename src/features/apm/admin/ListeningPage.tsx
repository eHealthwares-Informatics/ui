import {
  Box,
  Card,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
  Badge,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Textarea,
  Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useMentions,
  useListeningStats,
  useCreateMention,
  useUpdateMentionStatus,
  useCreateResponse,
} from '../website/admin-hooks';
import { apmBlue, ink, muted, accent } from '../website/layout';

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  whatsapp: '#25D366',
  twitter: '#1DA1F2',
  tiktok: '#000',
  instagram: '#E4405F',
  radio: '#F59E0B',
  blog: '#8B5CF6',
};

export function ListeningPage() {
  const { data: mentionsData, isLoading } = useMentions();
  const { data: stats } = useListeningStats();
  const createMention = useCreateMention();
  const updateStatus = useUpdateMentionStatus();
  const createResponse = useCreateResponse();
  const [opened, { open, close }] = useDisclosure(false);
  const [responseOpened, { open: openResponse, close: closeResponse }] = useDisclosure(false);
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null);
  const [form, setForm] = useState({
    platform: 'twitter',
    title: '',
    content: '',
    mentionUrl: '',
    sentiment: 'neutral',
    reach: 0,
    source: '',
    category: '',
    isUrgent: false,
  });
  const [responseForm, setResponseForm] = useState({
    content: '',
    responseType: 'rebuttal',
    publishedBy: '',
    platform: '',
  });

  const statCards = [
    { label: 'Total Mentions', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Urgent', value: stats?.urgent ?? 0, color: '#DC2626' },
    { label: 'Facebook', value: stats?.facebook ?? 0, color: platformColors.facebook },
    { label: 'Twitter/X', value: stats?.twitter ?? 0, color: platformColors.twitter },
    { label: 'WhatsApp', value: stats?.whatsapp ?? 0, color: platformColors.whatsapp },
    { label: 'TikTok', value: stats?.tiktok ?? 0, color: platformColors.tiktok },
  ];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Digital Listening Room
        </Title>
        <Button
          onClick={() => {
            setForm({
              platform: 'twitter',
              title: '',
              content: '',
              mentionUrl: '',
              sentiment: 'neutral',
              reach: 0,
              source: '',
              category: '',
              isUrgent: false,
            });
            open();
          }}
          style={{ background: apmBlue }}
        >
          Log Mention
        </Button>
      </Group>

      <Grid>
        {statCards.map((s) => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 4, md: 2 }}>
            <Card padding="md" radius="md" withBorder>
              <Stack gap={2} align="center">
                <Text size="xs" style={{ color: muted }}>
                  {s.label}
                </Text>
                <Text fw={800} style={{ fontSize: '1.5rem', color: s.color }}>
                  {s.value}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {isLoading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Platform</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Sentiment</Table.Th>
                <Table.Th>Reach</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(mentionsData?.items ?? []).map((m: any) => (
                <Table.Tr key={m.id} style={m.isUrgent ? { background: '#FEF2F2' } : undefined}>
                  <Table.Td>
                    <Badge
                      style={{ background: platformColors[m.platform] || muted, color: '#fff' }}
                    >
                      {m.platform}
                    </Badge>
                  </Table.Td>
                  <Table.Td
                    fw={600}
                    style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {m.title}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        m.sentiment === 'positive'
                          ? 'green'
                          : m.sentiment === 'negative'
                            ? 'red'
                            : 'gray'
                      }
                    >
                      {m.sentiment ?? '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{m.reach.toLocaleString()}</Table.Td>
                  <Table.Td style={{ color: muted }}>{m.category ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        m.status === 'new' ? 'red' : m.status === 'addressed' ? 'green' : 'gray'
                      }
                    >
                      {m.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Button
                        size="xs"
                        variant="light"
                        color="green"
                        onClick={() =>
                          updateStatus.mutate({
                            id: m.id,
                            status: m.status === 'new' ? 'reviewing' : 'addressed',
                          })
                        }
                      >
                        {m.status === 'new'
                          ? 'Review'
                          : m.status === 'reviewing'
                            ? 'Resolve'
                            : 'Reopen'}
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => {
                          setSelectedMentionId(m.id);
                          setResponseForm({
                            content: '',
                            responseType: 'rebuttal',
                            publishedBy: '',
                            platform: m.platform,
                          });
                          openResponse();
                        }}
                      >
                        Respond
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(mentionsData?.items ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', color: muted }}>
                    No mentions logged
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title="Log Mention" size="md">
        <Stack gap="sm">
          <Select
            label="Platform"
            data={[
              'facebook',
              'whatsapp',
              'twitter',
              'tiktok',
              'instagram',
              'radio',
              'blog',
              'other',
            ].map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
            value={form.platform}
            onChange={(v) => setForm({ ...form, platform: v ?? 'twitter' })}
          />
          <TextInput
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.currentTarget.value })}
          />
          <TextInput
            label="URL"
            value={form.mentionUrl}
            onChange={(e) => setForm({ ...form, mentionUrl: e.currentTarget.value })}
          />
          <Select
            label="Sentiment"
            data={['positive', 'negative', 'neutral'].map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            value={form.sentiment}
            onChange={(v) => setForm({ ...form, sentiment: v ?? 'neutral' })}
          />
          <TextInput
            label="Reach"
            type="number"
            value={form.reach}
            onChange={(e) => setForm({ ...form, reach: parseInt(e.currentTarget.value) || 0 })}
          />
          <Select
            label="Category"
            data={['awareness', 'credibility', 'imposition', 'fake-news', 'grievance', 'other'].map(
              (v) => ({
                value: v,
                label: v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              })
            )}
            value={form.category || null}
            onChange={(v) => setForm({ ...form, category: v ?? '' })}
            clearable
          />
          <Select
            label="Source"
            data={['organic', 'monitoring', 'supporter-report', 'media'].map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            value={form.source || null}
            onChange={(v) => setForm({ ...form, source: v ?? '' })}
            clearable
          />
          <Button
            fullWidth
            onClick={() => createMention.mutate(form, { onSuccess: close })}
            style={{ background: apmBlue }}
            mt="sm"
          >
            Log Mention
          </Button>
        </Stack>
      </Modal>

      <Modal opened={responseOpened} onClose={closeResponse} title="Rapid Response" size="md">
        <Stack gap="sm">
          <Select
            label="Response Type"
            data={['rebuttal', 'clarification', 'acknowledgment', 'escalation'].map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            value={responseForm.responseType}
            onChange={(v) => setResponseForm({ ...responseForm, responseType: v ?? 'rebuttal' })}
          />
          <Textarea
            label="Response Content"
            required
            minRows={4}
            value={responseForm.content}
            onChange={(e) => setResponseForm({ ...responseForm, content: e.currentTarget.value })}
          />
          <TextInput
            label="Published By"
            value={responseForm.publishedBy}
            onChange={(e) =>
              setResponseForm({ ...responseForm, publishedBy: e.currentTarget.value })
            }
          />
          <Button
            fullWidth
            onClick={() => {
              if (selectedMentionId) {
                createResponse.mutate(
                  { mentionId: selectedMentionId, ...responseForm },
                  { onSuccess: closeResponse }
                );
              }
            }}
            style={{ background: apmBlue }}
            mt="sm"
          >
            Publish Response
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
