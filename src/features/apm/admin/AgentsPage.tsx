import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Grid,
  Table,
  Button,
  Modal,
  TextInput,
  Select,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAgentStats, useAgents, useCreateAgent, useUpdateAgent } from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function AgentsPage() {
  const { data: stats } = useAgentStats();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [trainingFilter, setTrainingFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (search) {
      p.search = search;
    }
    if (roleFilter) {
      p.category = roleFilter;
    }
    if (trainingFilter) {
      p.trainingStatus = trainingFilter;
    }
    return p;
  }, [search, roleFilter, trainingFilter, page]);

  const { data: agentsData } = useAgents(params);
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const [opened, { open, close }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState({ pollingUnitId: '', name: '', phone: '', role: 'agent' });

  const statCards = [
    { label: 'Total Agents', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Trained', value: stats?.trained ?? 0, color: '#16A34A' },
    { label: 'Active', value: stats?.assigned ?? 0, color: '#16A34A' },
    { label: 'Standard', value: stats?.agent ?? 0, color: apmBlue },
    { label: 'Backups', value: stats?.backup ?? 0, color: '#EAB308' },
    { label: 'Supervisors', value: stats?.supervisor ?? 0, color: '#8B5CF6' },
  ];

  const handleCreate = () => {
    createAgent.mutate(form, {
      onSuccess: () => {
        close();
        setForm({ pollingUnitId: '', name: '', phone: '', role: 'agent' });
      },
    });
  };

  const handleUpdateTraining = (agent: any) => {
    const newStatus = agent.trainingStatus === 'trained' ? 'untrained' : 'trained';
    updateAgent.mutate({ id: agent.id, data: { trainingStatus: newStatus } });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Agent Management
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          Register Agent
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
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Group gap="sm">
        <TextInput
          placeholder="Search by name..."
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Role"
          clearable
          data={[
            { value: 'agent', label: 'Agent' },
            { value: 'backup-agent', label: 'Backup Agent' },
            { value: 'ward-supervisor', label: 'Ward Supervisor' },
            { value: 'lga-collation', label: 'LGA Collation' },
          ]}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="Training"
          clearable
          data={[
            { value: 'trained', label: 'Trained' },
            { value: 'untrained', label: 'Untrained' },
          ]}
          value={trainingFilter}
          onChange={(v) => {
            setTrainingFilter(v);
            setPage(1);
          }}
        />
      </Group>

      <Card padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Training</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(agentsData?.items ?? []).map((a: any) => (
              <Table.Tr key={a.id}>
                <Table.Td fw={600}>{a.name}</Table.Td>
                <Table.Td style={{ color: muted }}>{a.phone}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      a.role === 'ward-supervisor'
                        ? 'violet'
                        : a.role === 'backup-agent'
                          ? 'yellow'
                          : 'blue'
                    }
                  >
                    {a.role}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={a.trainingStatus === 'trained' ? 'green' : 'gray'}>
                    {a.trainingStatus}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={a.isActive ? 'green' : 'red'}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => {
                        setEditTarget(a);
                        openEdit();
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color={a.trainingStatus === 'trained' ? 'gray' : 'green'}
                      onClick={() => handleUpdateTraining(a)}
                    >
                      {a.trainingStatus === 'trained' ? 'Untrain' : 'Train'}
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {(agentsData?.items ?? []).length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center', color: muted }}>
                  No agents match filters
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        {agentsData && Math.ceil(agentsData.total / 20) > 1 && (
          <Group justify="center" mt="md">
            <Button variant="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Text size="sm" style={{ color: muted }}>
              Page {page} of {Math.ceil(agentsData.total / 20)}
            </Text>
            <Button
              variant="light"
              disabled={page >= Math.ceil(agentsData.total / 20)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Group>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Register Polling Agent" size="md">
        <Stack gap="sm">
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          />
          <TextInput
            label="Polling Unit ID"
            required
            value={form.pollingUnitId}
            onChange={(e) => setForm({ ...form, pollingUnitId: e.currentTarget.value })}
          />
          <Select
            label="Role"
            data={[
              { value: 'agent', label: 'Agent' },
              { value: 'backup-agent', label: 'Backup Agent' },
              { value: 'ward-supervisor', label: 'Ward Supervisor' },
              { value: 'lga-collation', label: 'LGA Collation' },
            ]}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v ?? 'agent' })}
          />
          <Button fullWidth onClick={handleCreate} style={{ background: apmBlue }} mt="sm">
            Register
          </Button>
        </Stack>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Edit Agent" size="md">
        {editTarget && (
          <Stack gap="sm">
            <TextInput
              label="Name"
              value={editTarget.name}
              onChange={(e) => setEditTarget({ ...editTarget, name: e.currentTarget.value })}
            />
            <TextInput
              label="Phone"
              value={editTarget.phone}
              onChange={(e) => setEditTarget({ ...editTarget, phone: e.currentTarget.value })}
            />
            <Select
              label="Role"
              data={[
                { value: 'agent', label: 'Agent' },
                { value: 'backup-agent', label: 'Backup Agent' },
                { value: 'ward-supervisor', label: 'Ward Supervisor' },
                { value: 'lga-collation', label: 'LGA Collation' },
              ]}
              value={editTarget.role}
              onChange={(v) => setEditTarget({ ...editTarget, role: v ?? 'agent' })}
            />
            <Textarea
              label="Notes"
              value={editTarget.notes ?? ''}
              onChange={(e) => setEditTarget({ ...editTarget, notes: e.currentTarget.value })}
            />
            <Button
              fullWidth
              onClick={() => {
                updateAgent.mutate({
                  id: editTarget.id,
                  data: {
                    name: editTarget.name,
                    phone: editTarget.phone,
                    role: editTarget.role,
                    notes: editTarget.notes,
                  },
                });
                closeEdit();
              }}
              style={{ background: apmBlue }}
              mt="sm"
            >
              Save
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
