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
  Tabs,
  Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useCanvassingStats,
  useCanvassingSessions,
  useCreateCanvassingSession,
  useUpdateCanvassingSession,
  useAllVisitStats,
  useLgas,
  useWards,
} from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function CanvassingPage() {
  const { data: stats, isLoading: statsLoading } = useCanvassingStats();
  const { data: sessionsData, isLoading: sessionsLoading } = useCanvassingSessions();
  const { data: visitStats } = useAllVisitStats();
  const { data: lgas } = useLgas();
  const createSession = useCreateCanvassingSession();
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({
    title: '',
    lgaId: '',
    wardId: '',
    teamLead: '',
    teamSize: 1,
    scheduledDate: '',
    notes: '',
  });
  const wardsQuery = useWards(form.lgaId);

  const statCards = [
    { label: 'Total Sessions', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Planned', value: stats?.planned ?? 0, color: '#94A3B8' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, color: '#EAB308' },
    { label: 'Completed', value: stats?.completed ?? 0, color: '#16A34A' },
    { label: 'Total Visits', value: stats?.totalVisits ?? 0, color: apmBlue },
    { label: 'Support Rate', value: visitStats?.supportRate ?? 0, color: '#16A34A' },
  ];

  const handleCreate = () => {
    createSession.mutate(
      {
        title: form.title,
        lgaId: form.lgaId,
        wardId: form.wardId || undefined,
        teamLead: form.teamLead || undefined,
        teamSize: form.teamSize,
        scheduledDate: form.scheduledDate || undefined,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          close();
          setForm({
            title: '',
            lgaId: '',
            wardId: '',
            teamLead: '',
            teamSize: 1,
            scheduledDate: '',
            notes: '',
          });
        },
      }
    );
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Canvassing Operations
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          New Session
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
                <Text fw={800} style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1.2 }}>
                  {s.value}
                  {s.label === 'Support Rate' ? '%' : ''}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Tabs defaultValue="all">
        <Tabs.List>
          <Tabs.Tab value="all">All Sessions</Tabs.Tab>
          <Tabs.Tab value="planned">Planned</Tabs.Tab>
          <Tabs.Tab value="in-progress">In Progress</Tabs.Tab>
          <Tabs.Tab value="completed">Completed</Tabs.Tab>
        </Tabs.List>

        {['all', 'planned', 'in-progress', 'completed'].map((tab) => (
          <Tabs.Panel key={tab} value={tab} pt="md">
            {sessionsLoading ? (
              <Skeleton height={300} radius="md" />
            ) : (
              <Card padding="lg" radius="md" withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Team Lead</Table.Th>
                      <Table.Th>Team Size</Table.Th>
                      <Table.Th>Scheduled</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(sessionsData?.items ?? [])
                      .filter((s: any) => tab === 'all' || s.status === tab)
                      .map((s: any) => (
                        <Table.Tr key={s.id}>
                          <Table.Td fw={600}>{s.title}</Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                s.status === 'completed'
                                  ? 'green'
                                  : s.status === 'in-progress'
                                    ? 'yellow'
                                    : 'gray'
                              }
                            >
                              {s.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ color: muted }}>{s.teamLead ?? '—'}</Table.Td>
                          <Table.Td>{s.teamSize}</Table.Td>
                          <Table.Td style={{ color: muted }}>
                            {s.scheduledDate ? new Date(s.scheduledDate).toLocaleDateString() : '—'}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    {sessionsData?.items?.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={5} style={{ textAlign: 'center', color: muted }}>
                          No sessions yet
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      <Modal opened={opened} onClose={close} title="New Canvassing Session" size="md">
        <Stack gap="sm">
          <TextInput
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
          />
          <Select
            label="LGA"
            data={(lgas ?? []).map((l: any) => ({ value: l.id, label: l.name }))}
            value={form.lgaId || null}
            onChange={(v) => setForm({ ...form, lgaId: v ?? '', wardId: '' })}
            searchable
            required
          />
          <Select
            label="Ward"
            data={(wardsQuery.data ?? []).map((w: any) => ({ value: w.id, label: w.name }))}
            value={form.wardId || null}
            onChange={(v) => setForm({ ...form, wardId: v ?? '' })}
            clearable
          />
          <TextInput
            label="Team Lead"
            value={form.teamLead}
            onChange={(e) => setForm({ ...form, teamLead: e.currentTarget.value })}
          />
          <TextInput
            label="Team Size"
            type="number"
            value={form.teamSize}
            onChange={(e) => setForm({ ...form, teamSize: parseInt(e.currentTarget.value) || 1 })}
          />
          <TextInput
            label="Scheduled Date"
            type="datetime-local"
            value={form.scheduledDate}
            onChange={(e) => setForm({ ...form, scheduledDate: e.currentTarget.value })}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleCreate} style={{ background: apmBlue }} mt="sm">
            Create Session
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
