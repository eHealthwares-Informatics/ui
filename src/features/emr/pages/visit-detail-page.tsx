import {
  Alert,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { PatientLink } from '../components/shared/patient-link';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';
import type { Visit } from '../lib/emr-types';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value || '—'}</Text>
    </Stack>
  );
}

export function VisitDetailPage() {
  const navigate = useNavigate();
  const { visitId } = useParams({ from: '/_authenticated/emr/visits/$visitId' });

  const visitQuery = useQuery({
    queryKey: ['emr', 'visits', visitId],
    queryFn: async () => {
      const { data } = await emrApi.get<Visit>(`/visits/${visitId}`);
      return data;
    },
  });

  const encountersQuery = useQuery({
    queryKey: ['emr', 'visits', visitId, 'encounters'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/encounters', {
        params: { visitId, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(visitId),
  });

  const requestsQuery = useQuery({
    queryKey: ['emr', 'visits', visitId, 'requests'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/requests', {
        params: { visitId, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(visitId),
  });

  if (visitQuery.isLoading) {
    return (
      <RxPage breadcrumbs={[{ label: 'EMR' }, { label: 'Visits', href: '/emr/visits' }]} title="">
        <Stack gap="md">
          <Skeleton height={140} radius="md" />
          <Skeleton height={200} radius="md" />
        </Stack>
      </RxPage>
    );
  }

  if (visitQuery.isError || !visitQuery.data) {
    return (
      <RxPage
        breadcrumbs={[{ label: 'EMR' }, { label: 'Visits', href: '/emr/visits' }]}
        title="Visit"
      >
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load visit">
          {visitQuery.error instanceof Error ? visitQuery.error.message : 'Visit not found.'}
        </Alert>
      </RxPage>
    );
  }

  const visit = visitQuery.data;
  const encounters = encountersQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  return (
    <RxPage
      breadcrumbs={[
        { label: 'EMR' },
        { label: 'Visits', href: '/emr/visits' },
        { label: visit.visitNumber },
      ]}
      title={`Visit ${visit.visitNumber}`}
      description={`${formatEnum(visit.visitType)} · ${visit.patientName}`}
    >
      <Stack gap="lg">
        <Card withBorder radius="md" padding="lg">
          <Group gap="xs" wrap="wrap" mb="md">
            <Badge variant="light">{visit.visitNumber}</Badge>
            <Badge variant="light" color="grape">
              {formatEnum(visit.visitType)}
            </Badge>
            <StatusBadge value={visit.status} kind="visit" />
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            <DetailRow label="Patient" value={<PatientLink mrn={visit.patientId} />} />
            <DetailRow label="MRN" value={visit.patientId} />
            <DetailRow label="Provider" value={visit.providerName} />
            <DetailRow
              label="Started"
              value={new Date(visit.startDatetime).toLocaleString()}
            />
            <DetailRow
              label="Ended"
              value={visit.stopDatetime ? new Date(visit.stopDatetime).toLocaleString() : undefined}
            />
          </SimpleGrid>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="sm">
            <Title order={4}>Encounters ({encounters.length})</Title>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Enc #</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Datetime</Table.Th>
                <Table.Th>Provider</Table.Th>
                <Table.Th>Reason</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {encounters.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>No encounters recorded for this visit.</Table.Td>
                </Table.Tr>
              ) : (
                encounters.map((row) => (
                  <Table.Tr
                    key={String(row.id)}
                    style={{ cursor: 'pointer' }}
                    onClick={() => void navigate({ to: `/emr/encounters/${String(row.id)}` })}
                  >
                    <Table.Td>
                      <Badge variant="light">{String(row.encounterNumber)}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge value={row.encounterType} kind="encounter" />
                    </Table.Td>
                    <Table.Td>
                      {row.encounterDatetime
                        ? new Date(String(row.encounterDatetime)).toLocaleString()
                        : '—'}
                    </Table.Td>
                    <Table.Td>{String(row.providerName ?? '—')}</Table.Td>
                    <Table.Td>{String(row.reason ?? '—')}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>

        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="sm">
            <Title order={4}>Requests ({requests.length})</Title>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Request #</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Priority</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Requested</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requests.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>No clinical requests for this visit.</Table.Td>
                </Table.Tr>
              ) : (
                requests.map((row) => (
                  <Table.Tr
                    key={String(row.id)}
                    style={{ cursor: 'pointer' }}
                    onClick={() => void navigate({ to: `/emr/requests/${String(row.id)}` })}
                  >
                    <Table.Td>
                      <Badge variant="light">{String(row.requestNumber)}</Badge>
                    </Table.Td>
                    <Table.Td>{formatEnum(String(row.requestType))}</Table.Td>
                    <Table.Td>
                      <StatusBadge value={row.priority} kind="priority" />
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge value={row.status} kind="request" />
                    </Table.Td>
                    <Table.Td>
                      {row.requestedAt
                        ? new Date(String(row.requestedAt)).toLocaleString()
                        : '—'}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </RxPage>
  );
}
