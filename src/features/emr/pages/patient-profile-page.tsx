import {
  Alert,
  Anchor,
  Avatar,
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
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, CalendarPlus, FilePlus2, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { AppointmentForm } from '../components/appointments/appointment-form';
import { DocumentationModal } from '../components/documentation/documentation-modal';
import { PatientEditForm } from '../components/patients/patient-edit-form';
import { RequestTimelineModal } from '../components/requests/request-timeline-modal';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';
import type { FormSubmission, PatientDetail } from '../lib/emr-types';

function initialsOf(patient: PatientDetail | undefined): string {
  if (!patient) {
    return '—';
  }
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

function ageFrom(dateOfBirth: string | null): string {
  if (!dateOfBirth) {
    return '';
  }
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return '';
  }
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return `${age} yrs`;
}

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

export function PatientProfilePage() {
  const navigate = useNavigate();
  const { patientId } = useParams({ from: '/_authenticated/emr/patients/$patientId' });
  const [activeTab, setActiveTab] = useState<string | null>('appointments');
  const [scheduleOpened, { open: openSchedule, close: closeSchedule }] = useDisclosure(false);
  const [docOpened, { open: openDoc, close: closeDoc }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [viewSubmission, setViewSubmission] = useState<FormSubmission | null>(null);
  const [amendSubmission, setAmendSubmission] = useState<FormSubmission | null>(null);
  const [timelineRequest, setTimelineRequest] = useState<Record<string, unknown> | null>(null);

  const patientQuery = useQuery({
    queryKey: ['emr', 'patients', patientId],
    queryFn: async () => {
      const { data } = await emrApi.get<PatientDetail>(`/patients/${patientId}`);
      return data;
    },
  });

  const patient = patientQuery.data;
  const mrn = patient?.patientId;

  const appointmentsQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'appointments'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/appointments', {
        params: { patientId: mrn, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(mrn),
  });

  const visitsQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'visits'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/visits', {
        params: { patientId: mrn, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(mrn),
  });

  const encountersQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'encounters'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/encounters', {
        params: { patientId: mrn, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(mrn),
  });

  const requestsQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'requests'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/requests', {
        params: { patientId: mrn, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(mrn),
  });

  const submissionsQuery = useQuery({
    queryKey: ['emr', 'patients', patientId, 'form-submissions'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: FormSubmission[] }>('/form-submissions', {
        params: { patientId: mrn, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(mrn),
  });

  const fullName = useMemo(
    () => (patient ? [patient.firstName, patient.lastName].filter(Boolean).join(' ') : ''),
    [patient],
  );

  const handleScheduled = () => {
    closeSchedule();
    void appointmentsQuery.refetch();
  };

  if (patientQuery.isLoading) {
    return (
      <RxPage breadcrumbs={[{ label: 'EMR' }, { label: 'Patients', href: '/emr/patients' }]} title="">
        <Stack gap="md">
          <Skeleton height={140} radius="md" />
          <Skeleton height={300} radius="md" />
        </Stack>
      </RxPage>
    );
  }

  if (patientQuery.isError || !patient) {
    return (
      <RxPage breadcrumbs={[{ label: 'EMR' }, { label: 'Patients', href: '/emr/patients' }]} title="Patient">
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load patient">
          {patientQuery.error instanceof Error ? patientQuery.error.message : 'Patient not found.'}
        </Alert>
      </RxPage>
    );
  }

  return (
    <RxPage
      breadcrumbs={[
        { label: 'EMR' },
        { label: 'Patients', href: '/emr/patients' },
        { label: fullName || patient.patientId },
      ]}
      title={fullName || patient.patientId}
      description={`MRN ${patient.patientId}`}
      actions={
        <Group gap="sm">
          <Button variant="light" leftSection={<Pencil size={16} />} onClick={openEdit}>
            Edit Patient
          </Button>
          <Button leftSection={<CalendarPlus size={16} />} onClick={openSchedule}>
            Schedule Appointment
          </Button>
        </Group>
      }
    >
      <Stack gap="lg">
        {/* HEADER CARD */}
        <Card withBorder radius="md" padding="lg">
          <Group align="flex-start" wrap="nowrap">
            <Avatar size={72} radius="xl" color="blue">
              {initialsOf(patient)}
            </Avatar>
            <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
              <Group gap="xs" wrap="wrap">
                <Title order={3}>{fullName}</Title>
                <Badge variant="light">{patient.patientId}</Badge>
                <StatusBadge value={patient.isActive} kind="active" />
              </Group>
              <Group gap="xs" wrap="wrap">
                {patient.gender && <Badge variant="dot" color="blue">{formatEnum(patient.gender)}</Badge>}
                {ageFrom(patient.dateOfBirth) && (
                  <Text size="sm" c="dimmed">
                    {ageFrom(patient.dateOfBirth)} · {patient.dateOfBirth}
                  </Text>
                )}
                {patient.occupation && (
                  <Text size="sm" c="dimmed">
                    {patient.occupation}
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} mt="lg" spacing="md">
            <DetailRow label="Phone" value={patient.phone} />
            <DetailRow label="Email" value={patient.email} />
            <DetailRow label="Address" value={patient.address} />
            <DetailRow label="Marital status" value={patient.maritalStatus ? formatEnum(patient.maritalStatus) : undefined} />
            <DetailRow label="Blood group" value={patient.bloodGroup} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} mt="md" spacing="md">
            <DetailRow label="Genotype" value={patient.genotype} />
            <DetailRow label="Next of kin" value={patient.nextOfKinName} />
            <DetailRow label="Next of kin phone" value={patient.nextOfKinPhone} />
            <DetailRow label="Relationship" value={patient.nextOfKinRelationship ? formatEnum(patient.nextOfKinRelationship) : undefined} />
          </SimpleGrid>
        </Card>

        {/* HISTORY TABS */}
        <Card withBorder radius="md" padding="lg">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="md">
              <Tabs.Tab value="appointments">Appointments ({appointmentsQuery.data?.length ?? 0})</Tabs.Tab>
              <Tabs.Tab value="visits">Visits ({visitsQuery.data?.length ?? 0})</Tabs.Tab>
              <Tabs.Tab value="encounters">Encounters ({encountersQuery.data?.length ?? 0})</Tabs.Tab>
              <Tabs.Tab value="requests">Requests ({requestsQuery.data?.length ?? 0})</Tabs.Tab>
              <Tabs.Tab value="documentation">Documentation ({submissionsQuery.data?.length ?? 0})</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="appointments">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Appt #</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th>Start</Table.Th>
                    <Table.Th>Provider</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(appointmentsQuery.data ?? []).map((row) => (
                    <Table.Tr key={String(row.id)}>
                      <Table.Td><Badge variant="light">{String(row.appointmentNumber)}</Badge></Table.Td>
                      <Table.Td>{formatEnum(String(row.appointmentType))}</Table.Td>
                      <Table.Td>{String(row.date ?? '—')}</Table.Td>
                      <Table.Td>{String(row.startTime ?? '—')}</Table.Td>
                      <Table.Td>{String(row.providerName ?? '—')}</Table.Td>
                      <Table.Td><StatusBadge value={row.status} kind="appointment" /></Table.Td>
                    </Table.Tr>
                  ))}
                  {(appointmentsQuery.data ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>No appointments yet.</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="visits">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Visit #</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Started</Table.Th>
                    <Table.Th>Provider</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(visitsQuery.data ?? []).map((row) => (
                    <Table.Tr key={String(row.id)}>
                      <Table.Td><Badge variant="light">{String(row.visitNumber)}</Badge></Table.Td>
                      <Table.Td>{formatEnum(String(row.visitType))}</Table.Td>
                      <Table.Td>{row.startDatetime ? new Date(String(row.startDatetime)).toLocaleString() : '—'}</Table.Td>
                      <Table.Td>{String(row.providerName ?? '—')}</Table.Td>
                      <Table.Td><StatusBadge value={row.status} kind="visit" /></Table.Td>
                    </Table.Tr>
                  ))}
                  {(visitsQuery.data ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>No visits yet.</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="encounters">
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
                  {(encountersQuery.data ?? []).map((row) => (
                    <Table.Tr
                      key={String(row.id)}
                      style={{ cursor: 'pointer' }}
                      onClick={() => void navigate({ to: `/emr/encounters/${String(row.id)}` })}
                    >
                      <Table.Td><Badge variant="light">{String(row.encounterNumber)}</Badge></Table.Td>
                      <Table.Td><StatusBadge value={row.encounterType} kind="encounter" /></Table.Td>
                      <Table.Td>{row.encounterDatetime ? new Date(String(row.encounterDatetime)).toLocaleString() : '—'}</Table.Td>
                      <Table.Td>{String(row.providerName ?? '—')}</Table.Td>
                      <Table.Td>{String(row.reason ?? '—')}</Table.Td>
                    </Table.Tr>
                  ))}
                  {(encountersQuery.data ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>No encounters yet.</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="documentation">
              <Group justify="flex-end" mb="sm">
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<FilePlus2 size={14} />}
                  onClick={openDoc}
                >
                  New Documentation
                </Button>
              </Group>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Submission #</Table.Th>
                    <Table.Th>Form</Table.Th>
                    <Table.Th>Version</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Submitted by</Table.Th>
                    <Table.Th>Submitted at</Table.Th>
                    <Table.Th>Encounter</Table.Th>
                    <Table.Th style={{ width: 120 }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(submissionsQuery.data ?? []).map((row) => (
                    <Table.Tr key={row.id}>
                      <Table.Td>
                        <Badge variant="light">{row.submissionNumber}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {row.formName}
                        </Text>
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
                        {row.encounterId ? (
                          <Anchor
                            component="button"
                            type="button"
                            size="sm"
                            fw={500}
                            onClick={() =>
                              void navigate({ to: `/emr/encounters/${row.encounterId}` })
                            }
                          >
                            View encounter
                          </Anchor>
                        ) : (
                          '—'
                        )}
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
                  ))}
                  {(submissionsQuery.data ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={8}>No documentation yet.</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="requests">
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Request #</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Requested</Table.Th>
                    <Table.Th style={{ width: 90 }} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(requestsQuery.data ?? []).map((row) => (
                    <Table.Tr
                      key={String(row.id)}
                      style={{ cursor: 'pointer' }}
                      onClick={() => void navigate({ to: `/emr/requests/${String(row.id)}` })}
                    >
                      <Table.Td><Badge variant="light">{String(row.requestNumber)}</Badge></Table.Td>
                      <Table.Td>{formatEnum(String(row.requestType))}</Table.Td>
                      <Table.Td><StatusBadge value={row.priority} kind="priority" /></Table.Td>
                      <Table.Td><StatusBadge value={row.status} kind="request" /></Table.Td>
                      <Table.Td>{row.requestedAt ? new Date(String(row.requestedAt)).toLocaleString() : '—'}</Table.Td>
                      <Table.Td onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="compact-xs"
                          variant="light"
                          onClick={() => setTimelineRequest(row)}
                        >
                          Timeline
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {(requestsQuery.data ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={6}>No requests yet.</Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      <PatientEditForm opened={editOpened} onClose={closeEdit} initial={patient} />

      <DocumentationModal
        opened={docOpened}
        onClose={closeDoc}
        initialPatient={patient ? { id: patient.id, patientId: patient.patientId, patientName: fullName } : null}
        onSubmitted={() => void submissionsQuery.refetch()}
      />

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

      <RequestTimelineModal
        opened={Boolean(timelineRequest)}
        onClose={() => setTimelineRequest(null)}
        requestId={timelineRequest ? String(timelineRequest.id) : null}
        summary={
          timelineRequest
            ? {
                requestNumber:
                  timelineRequest.requestNumber != null
                    ? String(timelineRequest.requestNumber)
                    : undefined,
                status: timelineRequest.status != null ? String(timelineRequest.status) : undefined,
                priority:
                  timelineRequest.priority != null ? String(timelineRequest.priority) : undefined,
                requestType:
                  timelineRequest.requestType != null ? String(timelineRequest.requestType) : undefined,
              }
            : null
        }
      />

      <Modal opened={scheduleOpened} onClose={closeSchedule} title="Schedule Appointment" size="lg" centered>
        <AppointmentForm
          onClose={closeSchedule}
          onCreated={handleScheduled}
          initialPatient={
            patient
              ? {
                  id: patient.id,
                  patientId: patient.patientId,
                  patientName: fullName,
                }
              : null
          }
        />
      </Modal>
    </RxPage>
  );
}
