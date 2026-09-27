import {
  Box,
  Card,
  Grid,
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
  Pagination,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useStakeholders,
  useLgas,
  useWards,
  useCreateStakeholder,
  useUpdateStakeholder,
} from '../website/admin-hooks';
import type { CreateStakeholderPayload, UpdateStakeholderPayload } from '../website/admin-types';
import { apmBlue, ink, muted } from '../website/layout';

const roleOptions = [
  'chairman',
  'councillor',
  'party-leader',
  'youth-leader',
  'women-leader',
  'religious-leader',
  'community-leader',
].map((r) => ({ value: r, label: r.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));

const affiliationOptions = ['PDP', 'APC', 'APM', 'LP', 'Other'].map((a) => ({
  value: a,
  label: a,
}));
const influenceOptions = ['high', 'medium', 'low'].map((i) => ({
  value: i,
  label: i.charAt(0).toUpperCase() + i.slice(1),
}));
const statusOptions = ['untouched', 'engaged', 'leaning', 'won', 'lost', 'hostile'].map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

function statusColor(status: string) {
  switch (status) {
    case 'won':
      return 'green';
    case 'leaning':
      return 'yellow';
    case 'engaged':
      return 'blue';
    case 'lost':
      return 'red';
    case 'hostile':
      return 'orange';
    default:
      return 'gray';
  }
}

export function StakeholdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateStakeholderPayload>({
    name: '',
    phone: '',
    email: '',
    role: '',
    lgaId: '',
    wardId: '',
    affiliation: '',
    influenceLevel: 'medium',
    conversionStatus: 'untouched',
    notes: '',
  });

  const { data, isLoading } = useStakeholders({
    page,
    limit: 20,
    search: search || undefined,
  } as any);
  const { data: lgas } = useLgas();
  const wardsQuery = useWards(form.lgaId);
  const createMutation = useCreateStakeholder();
  const updateMutation = useUpdateStakeholder();

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      role: '',
      lgaId: '',
      wardId: '',
      affiliation: '',
      influenceLevel: 'medium',
      conversionStatus: 'untouched',
      notes: '',
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: form as UpdateStakeholderPayload },
        {
          onSuccess: close,
        }
      );
    } else {
      createMutation.mutate(form, { onSuccess: close });
    }
  };

  const handleEdit = (stakeholder: any) => {
    setForm({
      name: stakeholder.name,
      phone: stakeholder.phone ?? '',
      email: stakeholder.email ?? '',
      role: stakeholder.role ?? '',
      lgaId: stakeholder.lgaId,
      wardId: stakeholder.wardId ?? '',
      affiliation: stakeholder.affiliation ?? '',
      influenceLevel: stakeholder.influenceLevel,
      conversionStatus: stakeholder.conversionStatus,
      notes: stakeholder.notes ?? '',
    });
    setEditingId(stakeholder.id);
    open();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Stakeholder Management
        </Title>
        <Button
          onClick={() => {
            resetForm();
            open();
          }}
          style={{ background: apmBlue }}
        >
          Add Stakeholder
        </Button>
      </Group>

      <TextInput
        placeholder="Search stakeholders..."
        value={search}
        onChange={(e) => {
          setSearch(e.currentTarget.value);
          setPage(1);
        }}
        style={{ maxWidth: 400 }}
      />

      {isLoading ? (
        <Skeleton height={400} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Affiliation</Table.Th>
                <Table.Th>Influence</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.items ?? []).map((s: any) => (
                <Table.Tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(s)}>
                  <Table.Td fw={600}>{s.name}</Table.Td>
                  <Table.Td style={{ color: muted }}>{s.phone ?? '—'}</Table.Td>
                  <Table.Td>{s.role ? s.role.replace(/-/g, ' ') : '—'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        s.affiliation === 'APM'
                          ? 'green'
                          : s.affiliation === 'PDP'
                            ? 'blue'
                            : 'gray'
                      }
                    >
                      {s.affiliation ?? '—'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        s.influenceLevel === 'high'
                          ? 'red'
                          : s.influenceLevel === 'medium'
                            ? 'yellow'
                            : 'gray'
                      }
                    >
                      {s.influenceLevel}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(s.conversionStatus)}>{s.conversionStatus}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', color: muted }}>
                    No stakeholders found
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          {data && data.total > data.limit && (
            <Group justify="center" mt="md">
              <Pagination
                total={Math.ceil(data.total / data.limit)}
                value={page}
                onChange={setPage}
              />
            </Group>
          )}
        </Card>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? 'Edit Stakeholder' : 'Add Stakeholder'}
        size="lg"
      >
        <Stack gap="sm">
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          />
          <TextInput
            label="Phone"
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.currentTarget.value })}
          />
          <TextInput
            label="Email"
            value={form.email ?? ''}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <Select
            label="Role"
            data={roleOptions}
            value={form.role || null}
            onChange={(v) => setForm({ ...form, role: v ?? '' })}
            clearable
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
            disabled={!form.lgaId}
          />
          <Select
            label="Affiliation"
            data={affiliationOptions}
            value={form.affiliation || null}
            onChange={(v) => setForm({ ...form, affiliation: v ?? '' })}
            clearable
          />
          <Select
            label="Influence Level"
            data={influenceOptions}
            value={form.influenceLevel}
            onChange={(v) => setForm({ ...form, influenceLevel: v ?? 'medium' })}
          />
          <Select
            label="Conversion Status"
            data={statusOptions}
            value={form.conversionStatus}
            onChange={(v) => setForm({ ...form, conversionStatus: v ?? 'untouched' })}
          />
          <Textarea
            label="Notes"
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleSubmit} style={{ background: apmBlue }} mt="sm">
            {editingId ? 'Update' : 'Create'} Stakeholder
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
