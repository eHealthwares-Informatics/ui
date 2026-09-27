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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  useResultDashboard,
  useResults,
  useCreateResult,
  useVerifyResult,
  useLgas,
} from '../website/admin-hooks';
import { apmBlue, ink, muted } from '../website/layout';

export function ResultsPage() {
  const { data: dashboard } = useResultDashboard();
  const { data: lgas } = useLgas();
  const createResult = useCreateResult();
  const verifyResult = useVerifyResult();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [lgaFilter, setLgaFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, limit: 20 };
    if (search) {
      p.search = search;
    }
    if (statusFilter) {
      p.status = statusFilter;
    }
    if (lgaFilter) {
      p.lgaId = lgaFilter;
    }
    return p;
  }, [search, statusFilter, lgaFilter, page]);

  const { data: resultsData } = useResults(params);

  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({
    pollingUnitId: '',
    lgaId: '',
    wardId: '',
    apmVotes: 0,
    pdpVotes: 0,
    apcVotes: 0,
    otherVotes: 0,
    registeredVoters: 0,
    enteredBy: '',
    notes: '',
  });

  const statCards = [
    { label: 'Total Entries', value: dashboard?.total ?? 0, color: apmBlue },
    { label: 'Submitted', value: dashboard?.submitted ?? 0, color: '#EAB308' },
    { label: 'Verified', value: dashboard?.verified ?? 0, color: '#16A34A' },
    { label: 'APM Votes', value: (dashboard?.totalApmVotes ?? 0).toLocaleString(), color: apmBlue },
    {
      label: 'PDP Votes',
      value: (dashboard?.totalPdpVotes ?? 0).toLocaleString(),
      color: '#DC2626',
    },
    {
      label: 'APC Votes',
      value: (dashboard?.totalApcVotes ?? 0).toLocaleString(),
      color: '#2563EB',
    },
  ];

  const handleCreate = () => {
    createResult.mutate(
      { ...form, otherVotes: form.otherVotes || 0, wardId: form.wardId || '' },
      {
        onSuccess: () => {
          close();
          setForm({
            pollingUnitId: '',
            lgaId: '',
            wardId: '',
            apmVotes: 0,
            pdpVotes: 0,
            apcVotes: 0,
            otherVotes: 0,
            registeredVoters: 0,
            enteredBy: '',
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
          Result Collation Dashboard
        </Title>
        <Button onClick={open} style={{ background: apmBlue }}>
          Enter Result
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
          placeholder="Search PU ID..."
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Status"
          clearable
          data={[
            { value: 'draft', label: 'Draft' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'verified', label: 'Verified' },
            { value: 'disputed', label: 'Disputed' },
          ]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="LGA"
          clearable
          data={(lgas ?? []).map((l: any) => ({ value: l.id, label: l.name }))}
          value={lgaFilter}
          onChange={(v) => {
            setLgaFilter(v);
            setPage(1);
          }}
          searchable
        />
      </Group>

      <Card padding="lg" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>PU ID</Table.Th>
              <Table.Th>APM</Table.Th>
              <Table.Th>PDP</Table.Th>
              <Table.Th>APC</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(resultsData?.items ?? []).map((r: any) => (
              <Table.Tr key={r.id}>
                <Table.Td style={{ color: muted }}>{r.pollingUnitId.slice(0, 8)}...</Table.Td>
                <Table.Td fw={600} style={{ color: apmBlue }}>
                  {r.apmVotes}
                </Table.Td>
                <Table.Td style={{ color: '#DC2626' }}>{r.pdpVotes}</Table.Td>
                <Table.Td style={{ color: '#2563EB' }}>{r.apcVotes}</Table.Td>
                <Table.Td fw={600}>{r.totalVotes}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      r.status === 'verified'
                        ? 'green'
                        : r.status === 'submitted'
                          ? 'yellow'
                          : 'gray'
                    }
                  >
                    {r.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {r.status !== 'verified' && (
                    <Button
                      size="xs"
                      variant="light"
                      color="green"
                      onClick={() => verifyResult.mutate(r.id)}
                    >
                      Verify
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {(resultsData?.items ?? []).length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', color: muted }}>
                  No results match filters
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        {resultsData && Math.ceil(resultsData.total / 20) > 1 && (
          <Group justify="center" mt="md">
            <Button variant="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Text size="sm" style={{ color: muted }}>
              Page {page} of {Math.ceil(resultsData.total / 20)}
            </Text>
            <Button
              variant="light"
              disabled={page >= Math.ceil(resultsData.total / 20)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </Group>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="Enter Result" size="md">
        <Stack gap="sm">
          <TextInput
            label="Polling Unit ID"
            required
            value={form.pollingUnitId}
            onChange={(e) => setForm({ ...form, pollingUnitId: e.currentTarget.value })}
          />
          <Select
            label="LGA"
            data={(lgas ?? []).map((l: any) => ({ value: l.id, label: l.name }))}
            value={form.lgaId || null}
            onChange={(v) => setForm({ ...form, lgaId: v ?? '' })}
            searchable
            required
          />
          <TextInput
            label="APM Votes"
            type="number"
            value={form.apmVotes}
            onChange={(e) => setForm({ ...form, apmVotes: parseInt(e.currentTarget.value) || 0 })}
          />
          <TextInput
            label="PDP Votes"
            type="number"
            value={form.pdpVotes}
            onChange={(e) => setForm({ ...form, pdpVotes: parseInt(e.currentTarget.value) || 0 })}
          />
          <TextInput
            label="APC Votes"
            type="number"
            value={form.apcVotes}
            onChange={(e) => setForm({ ...form, apcVotes: parseInt(e.currentTarget.value) || 0 })}
          />
          <TextInput
            label="Other Votes"
            type="number"
            value={form.otherVotes}
            onChange={(e) => setForm({ ...form, otherVotes: parseInt(e.currentTarget.value) || 0 })}
          />
          <TextInput
            label="Registered Voters"
            type="number"
            value={form.registeredVoters}
            onChange={(e) =>
              setForm({ ...form, registeredVoters: parseInt(e.currentTarget.value) || 0 })
            }
          />
          <TextInput
            label="Entered By"
            value={form.enteredBy}
            onChange={(e) => setForm({ ...form, enteredBy: e.currentTarget.value })}
          />
          <Button fullWidth onClick={handleCreate} style={{ background: apmBlue }} mt="sm">
            Submit Result
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
