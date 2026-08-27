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
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, FileText, Stethoscope } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import {
  DocumentationModal,
  type ActiveEncounter,
} from '../components/documentation/documentation-modal';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionSummary } from '../components/documentation/submission-summary';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { PatientLink } from '../components/shared/patient-link';
import { RequestForm } from '../components/requests/request-form';
import { StatusBadge } from '../components/shared/status-badge';
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
          <Button variant="light" leftSection={<Stethoscope size={16} />} onClick={openRequest}>
            Create Request
          </Button>
          <Button leftSection={<FileText size={16} />} onClick={openDoc}>
            Create Documentation
          </Button>
        </Group>
      }
    >
      <Tabs defaultValue="details">
        <Tabs.List mb="md">
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="documentation">
            Documentation ({submissionsQuery.data?.length ?? 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
          <Card withBorder radius="md" padding="lg">
            <Group gap="xs" wrap="wrap" mb="md">
              <Badge variant="light">{encounter.encounterNumber}</Badge>
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
                label="Datetime"
                value={new Date(encounter.encounterDatetime).toLocaleString()}
              />
            </SimpleGrid>

            {encounter.reason && <DetailRow label="Reason" value={encounter.reason} />}
            {encounter.notes && <DetailRow label="Notes" value={encounter.notes} />}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="documentation">
          <Card withBorder radius="md" padding="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Submission #</Table.Th>
                  <Table.Th>Form</Table.Th>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Submitted by</Table.Th>
                  <Table.Th>Submitted at</Table.Th>
                  <Table.Th style={{ width: 120 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {submissionsQuery.isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>Loading…</Table.Td>
                  </Table.Tr>
                ) : (submissionsQuery.data ?? []).length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      No documentation for this encounter yet.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  (submissionsQuery.data ?? []).map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Badge variant="light">{row.submissionNumber}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>
                            {row.formName}
                          </Text>
                          <SubmissionSummary submission={row} />
                        </Stack>
                      </Table.Td>
                      <Table.Td>v{row.formVersion}</Table.Td>
                      <Table.Td>
                        <StatusBadge value={row.status} kind="submission" />
                      </Table.Td>
                      <Table.Td>{row.submittedByName ?? '—'}</Table.Td>
                      <Table.Td>
                        {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Button
                            size="compact-xs"
                            variant="light"
                            onClick={() => setViewSubmission(row)}
                          >
                            View
                          </Button>
                          {row.status === 'SUBMITTED' && (
                            <Button
                              size="compact-xs"
                              variant="outline"
                              onClick={() => setAmendSubmission(row)}
                            >
                              Amend
                            </Button>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
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
