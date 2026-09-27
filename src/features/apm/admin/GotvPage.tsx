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
  Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useGotvStats, useGotvRecords, useCreateGotv, useUpdateGotv } from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function GotvPage() {
  const { data: stats } = useGotvStats();
  const createGotv = useCreateGotv();
  const updateGotv = useUpdateGotv();

  const [search, setSearch] = useState('');
  const [turnedOutFilter, setTurnedOutFilter] = useState<string | null>(null);
  const [contactedViaFilter, setContactedViaFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (search) {
      p.search = search;
    }
    if (turnedOutFilter) {
      p.turnedOut = turnedOutFilter;
    }
    if (contactedViaFilter) {
      p.contactedVia = contactedViaFilter;
    }
    return p;
  }, [search, turnedOutFilter, contactedViaFilter, page]);

  const { data: gotvData } = useGotvRecords(params);

  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({
    pollingUnitId: '',
    supporterName: '',
    supporterPhone: '',
    contactedVia: 'sms',
    notes: '',
  });

  const statCards = [
    { label: 'Total Supporters', value: stats?.total ?? 0, color: apmBlue },
    { label: 'Contacted', value: stats?.contacted ?? 0, color: '#EAB308' },
    { label: 'Turned Out', value: stats?.turnedOut ?? 0, color: '#16A34A' },
    { label: 'Turnout Rate', value: `${stats?.turnoutRate ?? 0}%`, color: '#16A34A' },
  ];

  const handleCreate = () => {
    createGotv.mutate(
      {
        pollingUnitId: form.pollingUnitId,
        supporterName: form.supporterName,
        supporterPhone: form.supporterPhone || undefined,
        contactedVia: form.contactedVia,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          close();
          setForm({
            pollingUnitId: '',
            supporterName: '',
            supporterPhone: '',
            contactedVia: 'sms',
            notes: '',
          });
        },
      }
    );
  };

  const handleToggleTurnout = (record: any) => {
    updateGotv.mutate({ id: record.id, data: { turnedOut: !record.turnedOut } });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3} style={{ color: ink }}>
          Get-Out-The-Vote Dashboard
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          Add Supporter
        </Button>
      </Group>

      <Grid>
        {statCards.map((s) => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 4, md: 3 }}>
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

      <Card padding="lg" radius="md" withBorder>
        <Stack gap="sm">
          <Text size="sm" style={{ color: muted }}>
            Turnout Progress
          </Text>
          <Progress value={stats?.turnoutRate ?? 0} color="green" size="lg" radius="md" />
          <Text size="xs" style={{ color: muted }}>
            {stats?.turnedOut ?? 0} of {stats?.total ?? 0} supporters voted
          </Text>
        </Stack>
      </Card>

      <Group gap="sm">
        <TextInput
          placeholder="Search supporter..."
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Turned Out"
          clearable
          data={[
            { value: 'true', label: 'Voted' },
            { value: 'false', label: 'Not Voted' },
          ]}
          value={turnedOutFilter}
          onChange={(v) => {
            setTurnedOutFilter(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="Contact Via"
          clearable
          data={[
            { value: 'sms', label: 'SMS' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'phone', label: 'Phone Call' },
            { value: 'visit', label: 'Visit' },
          ]}
          value={contactedViaFilter}
          onChange={(v) => {
            setContactedViaFilter(v);
            setPage(1);
          }}
        />
      </Group>

      <Card padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Supporter</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Contacted</Table.Th>
              <Table.Th>Via</Table.Th>
              <Table.Th>Turned Out</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(gotvData?.items ?? []).map((r: any) => (
              <Table.Tr key={r.id}>
                <Table.Td fw={600}>{r.supporterName}</Table.Td>
                <Table.Td style={{ color: muted }}>{r.supporterPhone ?? '—'}</Table.Td>
                <Table.Td>
                  <Badge color={r.contacted ? 'green' : 'gray'}>{r.contacted ? 'Yes' : 'No'}</Badge>
                </Table.Td>
                <Table.Td style={{ color: muted }}>{r.contactedVia ?? '—'}</Table.Td>
                <Table.Td>
                  <Badge color={r.turnedOut ? 'green' : 'red'}>{r.turnedOut ? 'Yes' : 'No'}</Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    color={r.turnedOut ? 'gray' : 'green'}
                    onClick={() => handleToggleTurnout(r)}
                  >
                    {r.turnedOut ? 'Undo' : 'Mark Voted'}
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {(gotvData?.items ?? []).length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: 'center', color: muted }}>
                  No supporters match filters
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        {gotvData && Math.ceil(gotvData.total / 20) > 1 && (
          <Group justify="center" mt="md">
            <Button variant="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Text size="sm" style={{ color: muted }}>
              Page {page} of {Math.ceil(gotvData.total / 20)}
            </Text>
            <Button
              variant="light"
              disabled={page >= Math.ceil(gotvData.total / 20)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Group>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Add Supporter" size="md">
        <Stack gap="sm">
          <TextInput
            label="Supporter Name"
            required
            value={form.supporterName}
            onChange={(e) => setForm({ ...form, supporterName: e.currentTarget.value })}
          />
          <TextInput
            label="Phone"
            value={form.supporterPhone}
            onChange={(e) => setForm({ ...form, supporterPhone: e.currentTarget.value })}
          />
          <TextInput
            label="Polling Unit ID"
            required
            value={form.pollingUnitId}
            onChange={(e) => setForm({ ...form, pollingUnitId: e.currentTarget.value })}
          />
          <Select
            label="Contact Via"
            data={[
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'phone', label: 'Phone Call' },
              { value: 'visit', label: 'Visit' },
            ]}
            value={form.contactedVia}
            onChange={(v) => setForm({ ...form, contactedVia: v ?? 'sms' })}
          />
          <Button fullWidth onClick={handleCreate} style={{ background: apmBlue }} mt="sm">
            Add Supporter
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
