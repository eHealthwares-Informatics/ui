import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';
import { useAuthStore } from '@/stores/auth-store';

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
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [holdReason, setHoldReason] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const { user } = useAuthStore();

  const fetchResults = () => {
    lisApi.get('/lis/results', { params: { limit: 100 } }).then((res) => {
      setResults(res.data?.data ?? []);
    });
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const filtered = statusFilter ? results.filter((r) => r.status === statusFilter) : results;

  const colorMap: Record<string, string> = {
    PENDING: 'yellow',
    TECHNICAL_REVIEW: 'blue',
    FINALIZED: 'green',
    CANCELLED: 'red',
    QA_HOLD: 'violet',
  };

  const counts = {
    PENDING: results.filter((r) => r.status === 'PENDING').length,
    TECHNICAL_REVIEW: results.filter((r) => r.status === 'TECHNICAL_REVIEW').length,
    FINALIZED: results.filter((r) => r.status === 'FINALIZED').length,
    QA_HOLD: results.filter((r) => r.status === 'QA_HOLD').length,
  };

  const openHoldModal = (result: ResultItem) => {
    setSelectedResult(result);
    setHoldReason('');
    open();
  };

  const submitHold = async () => {
    if (!selectedResult || !holdReason.trim()) return;
    try {
      await lisApi.post(`/lis/results/${selectedResult.id}/qa-hold`, {
        reason: holdReason.trim(),
        reviewerId: user?.id ?? 'unknown',
      });
      notifications.show({
        title: 'QA Hold',
        message: `Result placed on QA hold`,
        color: 'violet',
      });
      close();
      fetchResults();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err?.response?.data?.message ?? err.message ?? 'Failed to hold result',
        color: 'red',
      });
    }
  };

  const submitRelease = async (result: ResultItem) => {
    try {
      await lisApi.post(`/lis/results/${result.id}/qa-release`, {
        reviewerId: user?.id ?? 'unknown',
      });
      notifications.show({
        title: 'QA Release',
        message: `Result released from QA hold`,
        color: 'green',
      });
      fetchResults();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err?.response?.data?.message ?? err.message ?? 'Failed to release result',
        color: 'red',
      });
    }
  };

  return (
    <RxPage
      title="Result Validation"
      description="Review, validate and manage QA holds on test results."
    >
      <Stack gap="md">
        <SimpleGrid cols={4}>
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
          <Paper withBorder p="md" ta="center">
            <Text size="xs" c="dimmed">
              QA Hold
            </Text>
            <Title order={2} c="violet">
              {counts.QA_HOLD}
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
              { value: 'QA_HOLD', label: 'QA Hold' },
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
                <Table.Th>Actions</Table.Th>
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
                  <Table.Td>
                    <Group gap="xs">
                      {(r.status === 'PENDING' || r.status === 'TECHNICAL_REVIEW') && (
                        <Button
                          size="xs"
                          color="violet"
                          variant="light"
                          onClick={() => openHoldModal(r)}
                        >
                          Hold
                        </Button>
                      )}
                      {r.status === 'QA_HOLD' && (
                        <Button
                          size="xs"
                          color="green"
                          variant="light"
                          onClick={() => submitRelease(r)}
                        >
                          Release
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        <Modal opened={opened} onClose={close} title="Place Result on QA Hold" centered>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Result: {selectedResult?.orderItemId?.slice(0, 8)}… | Current Value:{' '}
              {selectedResult?.value ?? '-'}
            </Text>
            <TextInput
              label="Reason for Hold"
              placeholder="Enter the QA hold reason"
              value={holdReason}
              onChange={(e) => setHoldReason(e.currentTarget.value)}
              required
              data-testid="qa-hold-reason"
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button color="violet" onClick={submitHold} disabled={!holdReason.trim()}>
                Submit Hold
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </RxPage>
  );
}
