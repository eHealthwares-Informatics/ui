import { Badge, Card, Group, Stack, Table, Text, Timeline, Title } from '@mantine/core';
import { useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { lisApi } from '@/lib/lis-api';

type Amendment = {
  id: string;
  amendmentNumber: number;
  reason: string;
  previousValue: string | null;
  correctedValue: string | null;
  correctedById: string | null;
  correctedAt: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  supersededResultId: string | null;
};

type TimelineData = {
  original: Record<string, any>;
  amendments: Amendment[];
  supersededBy: Record<string, any> | null;
};

export function LisResultAmendmentsPage() {
  const { id } = useParams({ from: '/_authenticated/lis/result-amendments/$id/' });
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    lisApi
      .get(`/lis/results/${id}/amendment-timeline`)
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <RxPage title="Amendment Timeline" description="Loading...">
        <Text>Loading amendment history...</Text>
      </RxPage>
    );
  }

  if (!data) {
    return (
      <RxPage title="Amendment Timeline" description="Not found">
        <Text c="dimmed">Result not found or no amendment history available.</Text>
      </RxPage>
    );
  }

  const { original, amendments, supersededBy } = data;

  return (
    <RxPage
      title={`Amendment Timeline - ${original.orderItemId?.slice(0, 12) ?? 'Result'}...`}
      description={`${amendments.length} amendment(s) recorded`}
    >
      <Stack gap="md">
        {/* Original result card */}
        <Card withBorder padding="md">
          <Stack gap="xs">
            <Group>
              <Title order={5}>Original Result</Title>
              <Badge color={original.isLatest ? 'green' : 'gray'}>
                {original.isLatest ? 'Current' : 'Superseded'}
              </Badge>
            </Group>
            <Text size="sm">
              <strong>Value:</strong> {original.value ?? '-'}
            </Text>
            <Text size="sm">
              <strong>Status:</strong> {original.status}
            </Text>
            <Text size="sm">
              <strong>Amendment #:</strong> {original.amendmentNumber ?? 0}
            </Text>
            <Text size="sm">
              <strong>Entered:</strong> {original.enteredDate ?? '-'}
            </Text>
            {supersededBy && (
              <Text size="sm" c="blue">
                <strong>Superseded by:</strong> {supersededBy.id?.slice(0, 8)}… (value:{' '}
                {supersededBy.value ?? '-'})
              </Text>
            )}
          </Stack>
        </Card>

        {/* Amendment timeline */}
        {amendments.length > 0 && (
          <>
            <Title order={5}>Amendment History</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Previous Value</Table.Th>
                  <Table.Th>Corrected Value</Table.Th>
                  <Table.Th>Previous Status</Table.Th>
                  <Table.Th>New Status</Table.Th>
                  <Table.Th>Corrected By</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {amendments.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>{a.amendmentNumber}</Table.Td>
                    <Table.Td>{a.reason}</Table.Td>
                    <Table.Td>{a.previousValue ?? '-'}</Table.Td>
                    <Table.Td>
                      <Text fw={600}>{a.correctedValue ?? '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm">{a.previousStatus}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" color="blue">
                        {a.newStatus}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{a.correctedById?.slice(0, 8) ?? '-'}</Table.Td>
                    <Table.Td>
                      {a.correctedAt ? new Date(a.correctedAt).toLocaleDateString() : '-'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}

        {amendments.length === 0 && <Text c="dimmed">No amendments recorded for this result.</Text>}
      </Stack>
    </RxPage>
  );
}
