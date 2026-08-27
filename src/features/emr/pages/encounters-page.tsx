import {
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FileText, Plus, Search, TimerReset } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { EncounterForm } from '../components/encounters/encounter-form';
import { EncounterTimer } from '../components/encounters/encounter-timer';
import {
  DocumentationModal,
  type ActiveEncounter,
} from '../components/documentation/documentation-modal';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';

const ACTIVE_ENCOUNTER_KEY = 'emr-active-encounter';

function readActiveEncounter(): ActiveEncounter | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_ENCOUNTER_KEY);
    return raw ? (JSON.parse(raw) as ActiveEncounter) : null;
  } catch {
    return null;
  }
}

function isSameDay(iso: string): boolean {
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function EncountersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeEncounter, setActiveEncounter] = useState<ActiveEncounter | null>(
    () => readActiveEncounter(),
  );
  const [recordOpened, { open: openRecord, close: closeRecord }] = useDisclosure(false);
  const [docOpened, { open: openDoc, close: closeDoc }] = useDisclosure(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'encounters', page, search],
    queryFn: async () => {
      const res = await emrApi.get<{
        data: Array<Record<string, unknown>>;
        meta: { page: number; limit: number; total: number };
      }>('/encounters', { params: { page, limit: 20, search: search || undefined } });
      return res.data;
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const handleEncounterCreated = (record?: Record<string, unknown>) => {
    if (record?.id && record?.encounterDatetime) {
      const next: ActiveEncounter = {
        id: String(record.id),
        encounterNumber: String(record.encounterNumber ?? 'ENC'),
        patientId: String(record.patientId ?? ''),
        patientName: (record.patientName as string | null) ?? null,
        encounterType: String(record.encounterType ?? ''),
        providerName: (record.providerName as string | null) ?? null,
        encounterDatetime: String(record.encounterDatetime),
      };
      setActiveEncounter(next);
      window.localStorage.setItem(ACTIVE_ENCOUNTER_KEY, JSON.stringify(next));
      notifications.show({ message: 'Encounter timer started', color: 'blue' });
    }
  };

  const endEncounter = () => {
    setActiveEncounter(null);
    window.localStorage.removeItem(ACTIVE_ENCOUNTER_KEY);
    notifications.show({ message: 'Encounter session ended' });
  };

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: 'Encounters' }]}
      title="Encounters"
      description="Record clinical encounters and document patient care."
      actions={
        <Group gap="sm">
          <Button
            leftSection={<FileText size={16} />}
            variant="light"
            onClick={openDoc}
          >
            Create Documentation
          </Button>
          <Button leftSection={<Plus size={16} />} onClick={openRecord}>
            Record Encounter
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        {activeEncounter && (
          <Card withBorder radius="md" padding="lg" style={{ background: 'var(--mantine-color-blue-0)' }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={4}>
                <Text size="xs" fw={600} c="blue" tt="uppercase">
                  Active Encounter · {activeEncounter.encounterNumber}
                </Text>
                <Title order={3}>
                  {activeEncounter.patientName || activeEncounter.patientId}
                </Title>
                <Text size="sm" c="dimmed">
                  {formatEnum(activeEncounter.encounterType)}
                  {activeEncounter.providerName ? ` · ${activeEncounter.providerName}` : ''}
                </Text>
              </Stack>

              <Stack align="flex-end" gap={4}>
                <EncounterTimer startIso={activeEncounter.encounterDatetime} size="xl" />
                <Text size="xs" c="dimmed">
                  since {new Date(activeEncounter.encounterDatetime).toLocaleTimeString()}
                </Text>
              </Stack>
            </Group>

            <Group mt="md">
              <Button
                size="xs"
                variant="light"
                leftSection={<FileText size={14} />}
                onClick={openDoc}
              >
                Document this encounter
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<TimerReset size={14} />}
                onClick={endEncounter}
              >
                End session
              </Button>
            </Group>
          </Card>
        )}

        <Stack gap="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Search encounters…"
              leftSection={<Search size={15} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              style={{ maxWidth: 320 }}
            />
            <Text size="xs" c="dimmed">
              {total} records
            </Text>
          </Group>

          <Card withBorder radius="md" padding={0}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Enc #</Table.Th>
                  <Table.Th>Patient</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Datetime</Table.Th>
                  <Table.Th>Elapsed</Table.Th>
                  <Table.Th>Provider</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>Loading…</Table.Td>
                  </Table.Tr>
                ) : rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>No encounters recorded.</Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((row, index) => {
                    const started = String(row.encounterDatetime ?? '');
                    const today = started ? isSameDay(started) : false;
                    return (
                      <Table.Tr
                        key={String(row.id ?? index)}
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          row.id && void navigate({ to: `/emr/encounters/${String(row.id)}` })
                        }
                      >
                        <Table.Td>
                          <Badge variant="light">{String(row.encounterNumber ?? '—')}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {String(row.patientId ?? '—')}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge value={row.encounterType} kind="encounter" />
                        </Table.Td>
                        <Table.Td>
                          {started ? new Date(started).toLocaleString() : '—'}
                        </Table.Td>
                        <Table.Td>
                          {today ? (
                            <EncounterTimer startIso={started} size="sm" />
                          ) : started ? (
                            <Text size="sm" c="dimmed">
                              {new Date(started).toLocaleDateString()}
                            </Text>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                        <Table.Td>{String(row.providerName ?? '—')}</Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
            {totalPages > 1 && (
              <Group justify="flex-end" p="md">
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
          </Card>
        </Stack>
      </Stack>

      <EncounterForm
        opened={recordOpened}
        onClose={closeRecord}
        onCreated={handleEncounterCreated}
      />

      <DocumentationModal
        opened={docOpened}
        onClose={closeDoc}
        activeEncounter={activeEncounter}
      />
    </RxPage>
  );
}
