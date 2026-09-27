import { Badge, Group, Paper, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';

type ResultItem = {
  id: string;
  orderItemId: string;
  value: string | null;
  status: string;
  statusId: string | null;
  enteredById: string | null;
  validatedById: string | null;
  notes: string | null;
};

export function LisValidationDashboardPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>('PENDING');

  useEffect(() => {
    lisApi.get('/lis/results', { params: { limit: 50 } }).then((res) => {
      setResults(res.data?.data ?? []);
    });
  }, []);

  const filtered = statusFilter ? results.filter((r) => r.status === statusFilter) : results;

  const colorMap: Record<string, string> = {
    PENDING: 'yellow',
    TECHNICAL_REVIEW: 'blue',
    FINALIZED: 'green',
    CANCELLED: 'red',
  };

  const counts = {
    PENDING: results.filter((r) => r.status === 'PENDING').length,
    TECHNICAL_REVIEW: results.filter((r) => r.status === 'TECHNICAL_REVIEW').length,
    FINALIZED: results.filter((r) => r.status === 'FINALIZED').length,
  };

  return (
    <RxPage title="Result Validation" description="Review and validate test results.">
      <Stack gap="md">
        <SimpleGrid cols={3}>
          <Paper withBorder p="md" ta="center">
            <Text size="xs" c="dimmed">
              Pending
            </Text>
            <Title order={2} c="yellow">
              {counts.PENDING}
            </Title>
          </Paper>
          <Paper withBorder p="md" ta="center">
            <Text size="xs" c="dimmed">
              Technical Review
            </Text>
            <Title order={2} c="blue">
              {counts.TECHNICAL_REVIEW}
            </Title>
          </Paper>
          <Paper withBorder p="md" ta="center">
            <Text size="xs" c="dimmed">
              Finalized
            </Text>
            <Title order={2} c="green">
              {counts.FINALIZED}
            </Title>
          </Paper>
        </SimpleGrid>

        <Group>
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: '', label: 'All' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'TECHNICAL_REVIEW', label: 'Technical Review' },
              { value: 'FINALIZED', label: 'Finalized' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            clearable
          />
        </Group>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Order Item</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Entered By</Table.Th>
                <Table.Th>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.orderItemId?.slice(0, 8)}…</Table.Td>
                  <Table.Td>{r.value ?? '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={colorMap[r.status] ?? 'gray'}>{r.status}</Badge>
                  </Table.Td>
                  <Table.Td>{r.enteredById?.slice(0, 8) ?? '-'}</Table.Td>
                  <Table.Td>{r.notes ?? '-'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>
    </RxPage>
  );
}
