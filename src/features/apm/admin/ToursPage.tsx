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
  useTours,
  useTourStats,
  useCreateTour,
  useUpdateTour,
  useLgas,
  useWards,
} from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function ToursPage() {
  const { data: toursData, isLoading } = useTours();
  const { data: stats } = useTourStats();
  const { data: lgas } = useLgas();
  const createTour = useCreateTour();
  const updateTour = useUpdateTour();
  const [opened, { open, close }] = useDisclosure(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    lgaId: '',
    wardId: '',
    visitType: 'rally',
    tourDate: '',
    description: '',
    expectedAttendees: 0,
    notes: '',
  });
  const wardsQuery = useWards(form.lgaId);

  const statCards = [
    { label: 'Total Tours', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Planned', value: stats?.planned ?? 0, color: '#94A3B8' },
    { label: 'Completed', value: stats?.completed ?? 0, color: '#16A34A' },
    { label: 'Attendees', value: stats?.totalAttendees ?? 0, color: apmBlue },
    { label: 'Signups', value: stats?.totalSignups ?? 0, color: '#16A34A' },
  ];

  const resetForm = () =>
    setForm({
      title: '',
      lgaId: '',
      wardId: '',
      visitType: 'rally',
      tourDate: '',
      description: '',
      expectedAttendees: 0,
      notes: '',
    });

  const handleSubmit = () => {
    const payload = {
      title: form.title,
      lgaId: form.lgaId,
      wardId: form.wardId || undefined,
      visitType: form.visitType,
      tourDate: form.tourDate || undefined,
      description: form.description || undefined,
      expectedAttendees: form.expectedAttendees || undefined,
      notes: form.notes || undefined,
    };
    if (editId) {
      updateTour.mutate(
        { id: editId, data: payload },
        {
          onSuccess: () => {
            close();
            resetForm();
            setEditId(null);
          },
        }
      );
    } else {
      createTour.mutate(payload, {
        onSuccess: () => {
          close();
          resetForm();
        },
      });
    }
  };

  const openEdit = (tour: any) => {
    setEditId(tour.id);
    setForm({
      title: tour.title,
      lgaId: tour.lgaId,
      wardId: tour.wardId ?? '',
      visitType: tour.visitType,
      tourDate: tour.tourDate?.slice(0, 16) ?? '',
      description: tour.description ?? '',
      expectedAttendees: tour.expectedAttendees,
      notes: tour.notes ?? '',
    });
    open();
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Candidate Tour Intelligence
        </Title>
        <Button
          onClick={() => {
            resetForm();
            setEditId(null);
            open();
          }}
          style={{ background: apmBlue }}
        >
          New Tour
        </Button>
      </Group>

      <Grid>
        {statCards.map((s) => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 4, md: 2.4 }}>
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
                <Table.Th>Title</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Attendees</Table.Th>
                <Table.Th>Signups</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(toursData?.items ?? []).map((t: any) => (
                <Table.Tr key={t.id}>
                  <Table.Td fw={600}>{t.title}</Table.Td>
                  <Table.Td>
                    <Badge variant="light">{t.visitType}</Badge>
                  </Table.Td>
                  <Table.Td style={{ color: muted }}>
                    {t.tourDate ? new Date(t.tourDate).toLocaleDateString() : '—'}
                  </Table.Td>
                  <Table.Td>{t.actualAttendees ?? t.expectedAttendees ?? 0}</Table.Td>
                  <Table.Td fw={600} style={{ color: '#16A34A' }}>
                    {t.volunteerSignups}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        t.status === 'completed'
                          ? 'green'
                          : t.status === 'cancelled'
                            ? 'red'
                            : 'yellow'
                      }
                    >
                      {t.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Button size="xs" variant="light" color="gray" onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
              {(toursData?.items ?? []).length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', color: muted }}>
                    No tours yet
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Modal opened={opened} onClose={close} title={editId ? 'Edit Tour' : 'New Tour'} size="md">
        <Stack gap="sm">
          <TextInput
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
          />
          <Select
            label="Type"
            data={['rally', 'town-hall', 'meeting', 'stakeholder', 'inspection', 'other'].map(
              (v) => ({
                value: v,
                label: v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              })
            )}
            value={form.visitType}
            onChange={(v) => setForm({ ...form, visitType: v ?? 'rally' })}
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
            label="Date & Time"
            type="datetime-local"
            value={form.tourDate}
            onChange={(e) => setForm({ ...form, tourDate: e.currentTarget.value })}
          />
          <TextInput
            label="Expected Attendees"
            type="number"
            value={form.expectedAttendees}
            onChange={(e) =>
              setForm({ ...form, expectedAttendees: parseInt(e.currentTarget.value) || 0 })
            }
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleSubmit} style={{ background: apmBlue }} mt="sm">
            {editId ? 'Update' : 'Create'} Tour
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
