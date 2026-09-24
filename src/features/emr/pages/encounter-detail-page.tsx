import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, FileText, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import {
  DocumentationModal,
  type ActiveEncounter,
} from '../components/documentation/documentation-modal';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { PatientLink } from '../components/shared/patient-link';
import { RequestForm } from '../components/requests/request-form';
import { StatusBadge } from '../components/shared/status-badge';
import { DocumentsAccordion, RequestsAccordion } from '../components/encounters/encounter-activity-accordion';
import { formatEnum } from '../lib/emr-constants';
import { usePatientByMrn } from '../hooks/use-patient-by-mrn';
import type { Encounter, FormSubmission, Visit } from '../lib/emr-types';

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

/**
 * Live elapsed timer for an ACTIVE encounter. Auto-ends the encounter via
 * [onAutoEnd] once [autoEndAfterHours] have elapsed.
 */
function LiveEncounterTimer({
  startedAt,
  endedAt,
  autoEndAfterHours,
  onAutoEnd,
}: {
  startedAt: string;
  endedAt: string | null;
  autoEndAfterHours: number;
  onAutoEnd?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [endedAt]);

  useEffect(() => {
    if (endedAt || !onAutoEnd) return;
    const hours = (now - new Date(startedAt).getTime()) / 3_600_000;
    if (hours >= autoEndAfterHours) onAutoEnd();
  }, [now, startedAt, endedAt, autoEndAfterHours, onAutoEnd]);

  if (endedAt) return null;

  const ms = Math.max(0, now - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Card
      withBorder
      radius="md"
      padding="sm"
      mb="md"
      style={{ borderColor: 'var(--mantine-color-blue-3)' }}
    >
      <Group gap="xs" justify="center">
        <Text size="sm" fw={700} ff="monospace">
          {pad(hours)}:{pad(minutes)}:{pad(seconds)}
        </Text>
        <Text size="xs" c="dimmed">
          elapsed · auto-ends after {autoEndAfterHours}h
        </Text>
      </Group>
    </Card>
  );
}

export function EncounterDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { encounterId } = useParams({ from: '/_authenticated/emr/encounters/$encounterId' });
  const [docOpened, { open: openDoc, close: closeDoc }] = useDisclosure(false);
  const [requestOpened, { open: openRequest, close: closeRequest }] = useDisclosure(false);
  const [viewSubmission, setViewSubmission] = useState<FormSubmission | null>(null);
  const [amendSubmission, setAmendSubmission] = useState<FormSubmission | null>(null);

  const encounterQuery = useQuery({
    queryKey: ['emr', 'encounters', encounterId],
    queryFn: async () => {
      const { data } = await emrApi.get<Encounter>(`/encounters/${encounterId}`);
      return data;
    },
  });

  const encounter = encounterQuery.data;
  const patientQuery = usePatientByMrn(encounter?.patientId);

  const visitQuery = useQuery({
    queryKey: ['emr', 'visits', encounter?.visitId],
    queryFn: async () => {
      const { data } = await emrApi.get<Visit>(`/visits/${encounter!.visitId}`);
      return data;
    },
    enabled: Boolean(encounter?.visitId),
  });

  const submissionsQuery = useQuery({
    queryKey: ['emr', 'form-submissions', 'encounter', encounterId],
    queryFn: async () => {
      const res = await emrApi.get<{ data: FormSubmission[] }>('/form-submissions', {
        params: { encounterId, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(encounterId),
  });

  const requestsQuery = useQuery({
    queryKey: ['emr', 'encounters', encounterId, 'requests'],
    queryFn: async () => {
      // Requests of the encounter AND its whole visit.
      const [byEncounter, byVisit] = await Promise.all([
        emrApi.get<{ data: Array<Record<string, unknown>> }>('/requests', {
          params: { encounterId, limit: 100 },
        }),
        encounter?.visitId
          ? emrApi.get<{ data: Array<Record<string, unknown>> }>('/requests', {
              params: { visitId: encounter.visitId, limit: 100 },
            })
          : Promise.resolve({ data: { data: [] as Array<Record<string, unknown>> } }),
      ]);
      const merged = new Map<string, Record<string, unknown>>();
      for (const row of [...byEncounter.data.data, ...byVisit.data.data]) {
        if (row && typeof row === 'object' && typeof row.id === 'string') {
          merged.set(row.id, row);
        }
      }
      return Array.from(merged.values());
    },
    enabled: Boolean(encounterId),
  });

  const encounterMutationInProgress =
    encounter?.status === 'ACTIVE';

  const endEncounterMutation = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.patch(`/encounters/${encounterId}`, {
        status: 'COMPLETED',
        endedAt: new Date().toISOString(),
      });
      return data;
    },
  });
  const endEncounterPending = endEncounterMutation.isPending;

  const activeEncounter: ActiveEncounter | null = encounter
    ? {
        id: encounter.id,
        encounterNumber: encounter.encounterNumber,
        patientId: encounter.patientId,
        patientName: patientQuery.data
          ? `${patientQuery.data.firstName} ${patientQuery.data.lastName}`
          : null,
        encounterType: encounter.encounterType,
        providerName: encounter.providerName,
        encounterDatetime: encounter.encounterDatetime,
      }
    : null;

  if (encounterQuery.isLoading) {
    return (
      <RxPage breadcrumbs={[{ label: 'EMR' }, { label: 'Encounters', href: '/emr/encounters' }]} title="">
        <Skeleton height={200} radius="md" />
      </RxPage>
    );
  }

  if (encounterQuery.isError || !encounter) {
    return (
      <RxPage
        breadcrumbs={[{ label: 'EMR' }, { label: 'Encounters', href: '/emr/encounters' }]}
        title="Encounter"
      >
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load encounter">
          {encounterQuery.error instanceof Error
            ? encounterQuery.error.message
            : 'Encounter not found.'}
        </Alert>
      </RxPage>
    );
  }

  return (
    <RxPage
      breadcrumbs={[
        { label: 'EMR' },
        { label: 'Encounters', href: '/emr/encounters' },
        { label: encounter.encounterNumber },
      ]}
      title={`Encounter ${encounter.encounterNumber}`}
      description={encounter.reason ?? formatEnum(encounter.encounterType)}
      actions={
        <Group gap="sm">
          {encounter.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              color="red"
              loading={endEncounterPending}
              onClick={() => {
                endEncounterMutation.mutate(undefined, {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({
                      queryKey: ['emr', 'encounters', encounterId],
                    });
                  },
                });
              }}
            >
              End Encounter
            </Button>
          )}
          <Button variant="light" leftSection={<Stethoscope size={16} />} onClick={openRequest}>
            Create Request
          </Button>
          <Button leftSection={<FileText size={16} />} onClick={openDoc}>
            Create Documentation
          </Button>
        </Group>
      }
    >
      <LiveEncounterTimer
        startedAt={encounter.encounterDatetime}
        endedAt={encounter.endedAt ?? null}
        autoEndAfterHours={8}
        onAutoEnd={
          encounterMutationInProgress
            ? () => {
                endEncounterMutation.mutate(undefined, {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({
                      queryKey: ['emr', 'encounters', encounterId],
                    });
                  },
                });
              }
            : undefined
        }
      />

      <Tabs defaultValue="details">
        <Tabs.List mb="md">
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="documentation">
            Documentation ({submissionsQuery.data?.length ?? 0})
          </Tabs.Tab>
          <Tabs.Tab value="requests">
            Requests ({requestsQuery.data?.length ?? 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
          <Card withBorder radius="md" padding="lg">
            <Group gap="xs" wrap="wrap" mb="md">
              <Badge variant="light">{encounter.encounterNumber}</Badge>
              <Badge
                variant="filled"
                color={
                  encounter.status === 'COMPLETED'
                    ? 'gray'
                    : encounter.status === 'CANCELLED'
                      ? 'red'
                      : 'blue'
                }
              >
                {encounter.status ?? 'ACTIVE'}
              </Badge>
              <StatusBadge value={encounter.encounterType} kind="encounter" />
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
              <DetailRow label="Patient" value={<PatientLink mrn={encounter.patientId} />} />
              <DetailRow label="MRN" value={encounter.patientId} />
              {encounter.visitId && (
                <DetailRow
                  label="Visit"
                  value={
                    <Anchor
                      component="button"
                      type="button"
                      size="sm"
                      fw={500}
                      onClick={() => void navigate({ to: `/emr/visits/${encounter.visitId}` })}
                    >
                      {visitQuery.data?.visitNumber ?? 'View visit'}
                    </Anchor>
                  }
                />
              )}
              <DetailRow label="Provider" value={encounter.providerName} />
              <DetailRow
                label="Start"
                value={new Date(encounter.encounterDatetime).toLocaleString()}
              />
              <DetailRow
                label="End"
                value={
                  encounter.endedAt
                    ? new Date(encounter.endedAt).toLocaleString()
                    : encounter.status === 'ACTIVE'
                      ? 'In progress'
                      : '—'
                }
              />
              <DetailRow
                label="Created"
                value={
                  (encounter as unknown as { createdAt?: string }).createdAt
                    ? new Date(
                        (encounter as unknown as { createdAt?: string }).createdAt!,
                      ).toLocaleString()
                    : '—'
                }
              />
            </SimpleGrid>

            {encounter.reason && <DetailRow label="Reason" value={encounter.reason} />}
            {encounter.notes && <DetailRow label="Notes" value={encounter.notes} />}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="documentation">
          <Card withBorder radius="md" padding="lg">
            <DocumentsAccordion
              submissions={submissionsQuery.data ?? []}
              isLoading={submissionsQuery.isLoading}
              onView={setViewSubmission}
              onAmend={setAmendSubmission}
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="requests">
          <Card withBorder radius="md" padding="lg">
            <RequestsAccordion requests={requestsQuery.data ?? []} isLoading={requestsQuery.isLoading} />
          </Card>
        </Tabs.Panel>
      </Tabs>

      <DocumentationModal
        opened={docOpened}
        onClose={closeDoc}
        activeEncounter={activeEncounter}
      />

      <Modal
        opened={requestOpened}
        onClose={closeRequest}
        title="New Clinical Request"
        size="lg"
        centered
      >
        <RequestForm
          initialPatient={
            patientQuery.data
              ? {
                  id: patientQuery.data.id,
                  patientId: patientQuery.data.patientId,
                  patientName: `${patientQuery.data.firstName} ${patientQuery.data.lastName}`,
                }
              : null
          }
          lockPatient
          submitUrl={`/encounters/${encounter.id}/requests`}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
            queryClient.invalidateQueries({
              queryKey: ['emr', 'encounters', encounter.id, 'requests'],
            });
            closeRequest();
          }}
          onClose={closeRequest}
        />
      </Modal>

      <SubmissionViewModal
        opened={Boolean(viewSubmission)}
        onClose={() => setViewSubmission(null)}
        submission={viewSubmission}
        onJump={setViewSubmission}
      />

      <SubmissionAmendModal
        opened={Boolean(amendSubmission)}
        onClose={() => setAmendSubmission(null)}
        submission={amendSubmission}
      />
    </RxPage>
  );
}
