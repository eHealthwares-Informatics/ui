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
  Select,
  Textarea,
  Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  useVolunteerAssignments,
  useVolunteerStats,
  useCreateVolunteerAssignment,
  useUpdateVolunteerAssignment,
  useLgas,
  useWards,
} from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function VolunteersPage() {
  const { data: assignments, isLoading } = useVolunteerAssignments();
  const { data: stats } = useVolunteerStats();
  const { data: lgas } = useLgas();
  const createAssignment = useCreateVolunteerAssignment();
  const updateAssignment = useUpdateVolunteerAssignment();
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ volunteerId: '', lgaId: '', wardId: '', role: '', notes: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const wardsQuery = useWards(form.lgaId);

  const statCards = [
    { label: 'Total Volunteers', value: stats?.totalVolunteers ?? 0, color: apmBlue },
    { label: 'Assignments', value: stats?.totalAssignments ?? 0, color: apmBlue },
    { label: 'Active', value: stats?.activeAssignments ?? 0, color: '#16A34A' },
  ];

  const resetForm = () => {
    setForm({ volunteerId: '', lgaId: '', wardId: '', role: '', notes: '' });
    setEditId(null);
  };

  const handleSubmit = () => {
    if (editId) {
      updateAssignment.mutate(
        {
          id: editId,
          data: {
            wardId: form.wardId || undefined,
            role: form.role || undefined,
            notes: form.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            close();
            resetForm();
          },
        }
      );
    } else {
      createAssignment.mutate(
        {
          volunteerId: form.volunteerId,
          lgaId: form.lgaId,
          wardId: form.wardId || undefined,
          role: form.role || undefined,
          notes: form.notes || undefined,
        },
        {
          onSuccess: () => {
            close();
            resetForm();
          },
        }
      );
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Volunteer Assignments
        </Title>
        <Button
          onClick={() => {
            resetForm();
            open();
          }}
          style={{ background: apmBlue }}
        >
          Assign Volunteer
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
        <Skeleton height={300} radius="md" />
      ) : (
        <Card padding="lg" radius="md" withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Volunteer ID</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Assigned</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(assignments?.items ?? []).map((a: any) => (
                <Table.Tr key={a.id}>
                  <Table.Td fw={600}>{a.volunteerId.slice(0, 8)}…</Table.Td>
                  <Table.Td style={{ color: muted }}>{a.role ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        a.status === 'active'
                          ? 'green'
                          : a.status === 'inactive'
                            ? 'gray'
                            : 'yellow'
                      }
                    >
                      {a.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>
                    {a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : '—'}
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      onClick={() => {
                        setEditId(a.id);
                        setForm({
                          ...form,
                          wardId: a.wardId ?? '',
                          role: a.role ?? '',
                          notes: a.notes ?? '',
                        });
                        open();
                      }}
                    >
                      Edit
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(assignments?.items ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center', color: muted }}>
                    No assignments yet
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editId ? 'Edit Assignment' : 'Assign Volunteer'}
        size="md"
      >
        <Stack gap="sm">
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
          <Select
            label="Role"
            data={['canvasser', 'team-lead', 'agent', 'mobilizer', 'data-entry'].map((r) => ({
              value: r,
              label: r.replace(/-/g, ' '),
            }))}
            value={form.role || null}
            onChange={(v) => setForm({ ...form, role: v ?? '' })}
            clearable
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleSubmit} style={{ background: apmBlue }} mt="sm">
            {editId ? 'Update' : 'Assign'}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
