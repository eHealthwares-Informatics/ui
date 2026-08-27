import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  CopyButton,
  Group,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, Check, Copy, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { SubmissionAmendModal } from '../components/documentation/submission-amend-modal';
import { SubmissionViewModal } from '../components/documentation/submission-view-modal';
import { PatientLink } from '../components/shared/patient-link';
import { StatusBadge } from '../components/shared/status-badge';
import { RequestNoteComposer } from '../components/requests/request-note-composer';
import { StatusTimeline } from '../components/requests/status-timeline';
import { formatEnum } from '../lib/emr-constants';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { FormSubmission, RequestDetail, RequestStatus } from '../lib/emr-types';

type TransitionDef = {
  label: string;
  to: RequestStatus;
  color: 'blue' | 'teal' | 'red';
  needsReason?: boolean;
};

const TRANSITIONS: Record<RequestStatus, TransitionDef[]> = {
  REQUESTED: [
    { label: 'Mark In Progress', to: 'IN_PROGRESS', color: 'blue' },
    { label: 'Mark Complete', to: 'COMPLETED', color: 'teal' },
    { label: 'Cancel Request', to: 'CANCELLED', color: 'red', needsReason: true },
    { label: 'Reject Request', to: 'REJECTED', color: 'red', needsReason: true },
  ],
  IN_PROGRESS: [
    { label: 'Mark Complete', to: 'COMPLETED', color: 'teal' },
    { label: 'Cancel Request', to: 'CANCELLED', color: 'red', needsReason: true },
    { label: 'Reject Request', to: 'REJECTED', color: 'red', needsReason: true },
  ],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

function CopyValue({ value }: { value: string }) {
  return (
    <Group gap={4} wrap="nowrap">
      <Text size="sm" style={{ wordBreak: 'break-all' }}>
        {value}
      </Text>
      <CopyButton value={value} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied' : 'Copy to clipboard'} withArrow>
            <ActionIcon
              variant="subtle"
              size="sm"
              color={copied ? 'teal' : 'gray'}
              onClick={copy}
              aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
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

export function RequestDetailPage() {
  const navigate = useNavigate();
  const { requestId } = useParams({ from: '/_authenticated/emr/requests/$requestId' });
  const queryClient = useQueryClient();
  const [pendingTransition, setPendingTransition] = useState<TransitionDef | null>(null);
  const [reason, setReason] = useState('');
  const [reasonOpened, { open: openReason, close: closeReason }] = useDisclosure(false);
  const [viewSubmission, setViewSubmission] = useState<FormSubmission | null>(null);
  const [amendSubmission, setAmendSubmission] = useState<FormSubmission | null>(null);

  const { data: request, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['emr', 'requests', requestId],
    queryFn: async () => {
      const { data } = await emrApi.get<RequestDetail>(`/requests/${requestId}`);
      return data;
    },
  });

  const encounterSubmissionsQuery = useQuery({
    queryKey: ['emr', 'form-submissions', 'request', requestId, 'encounter'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: FormSubmission[] }>('/form-submissions', {
        params: { encounterId: request?.encounterId, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(request?.encounterId),
  });

  const visitSubmissionsQuery = useQuery({
    queryKey: ['emr', 'form-submissions', 'request', requestId, 'visit'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: FormSubmission[] }>('/form-submissions', {
        params: { visitId: request?.visitId, limit: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(request?.visitId),
  });

  const submissions = useMemo(() => {
    const byId = new Map<string, FormSubmission>();
    for (const submission of [
      ...(encounterSubmissionsQuery.data ?? []),
      ...(visitSubmissionsQuery.data ?? []),
    ]) {
      if (!byId.has(submission.id)) {
        byId.set(submission.id, submission);
      }
    }
    return [...byId.values()].sort((a, b) =>
      (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''),
    );
  }, [encounterSubmissionsQuery.data, visitSubmissionsQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data } = await emrApi.post<RequestDetail>(`/requests/${requestId}/sync`, {});
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['emr', 'requests', requestId], updated);
      queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
      if (updated.syncStatus === 'SYNCED') {
        notifications.show({ message: 'Request synced successfully', color: 'teal' });
      } else if (updated.syncStatus === 'FAILED') {
        notifications.show({
          color: 'red',
          message: `Sync failed: ${updated.syncError ?? 'Unknown error'}`,
        });
      } else {
        notifications.show({ message: `Sync status: ${updated.syncStatus}` });
      }
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      status,
      reason: transitionReason,
    }: {
      status: RequestStatus;
      reason?: string;
    }) => {
      const { data } = await emrApi.post(`/requests/${requestId}/transition`, {
        status,
        reason: transitionReason || undefined,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      notifications.show({
        message: `Request marked ${variables.status.toLowerCase().replace(/_/g, ' ')}`,
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
      void refetch();
      closeReason();
      setPendingTransition(null);
    },
    onError: (transitionError) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(transitionError) });
    },
  });

  const runTransition = (transition: TransitionDef, withReason: string) => {
    transitionMutation.mutate({ status: transition.to, reason: withReason });
  };

  const handleTransitionClick = (transition: TransitionDef) => {
    if (transition.needsReason) {
      setPendingTransition(transition);
      setReason('');
      openReason();
    } else {
      runTransition(transition, '');
    }
  };

  if (isLoading) {
    return (
      <RxPage breadcrumbs={[{ label: 'EMR' }, { label: 'Clinical Requests', href: '/emr/requests' }]} title="">
        <Stack gap="md">
          <Skeleton height={120} radius="md" />
          <Skeleton height={300} radius="md" />
        </Stack>
      </RxPage>
    );
  }

  if (isError || !request) {
    return (
      <RxPage
        breadcrumbs={[{ label: 'EMR' }, { label: 'Clinical Requests', href: '/emr/requests' }]}
        title="Clinical Request"
      >
        <Alert color="red" icon={<AlertCircle size={16} />} title="Unable to load request">
          {error instanceof Error ? error.message : 'Request not found.'}
        </Alert>
      </RxPage>
    );
  }

  const availableTransitions = TRANSITIONS[request.status] ?? [];
  const canSync = request.requestType === 'LAB' || request.requestType === 'PRESCRIPTION';

  return (
    <RxPage
      breadcrumbs={[
        { label: 'EMR' },
        { label: 'Clinical Requests', href: '/emr/requests' },
        { label: request.requestNumber },
      ]}
      title={`Request ${request.requestNumber}`}
      description={request.diagnosis ?? formatEnum(request.requestType)}
      actions={
        (canSync || availableTransitions.length > 0) && (
          <Group gap="sm">
            {canSync && (
              <Button
                size="sm"
                variant="light"
                leftSection={<RefreshCw size={14} />}
                loading={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                Re-sync
              </Button>
            )}
            {availableTransitions.map((transition) => (
              <Button
                key={transition.to}
                size="sm"
                color={transition.color}
                variant={transition.color === 'red' ? 'outline' : 'filled'}
                loading={transitionMutation.isPending}
                onClick={() => handleTransitionClick(transition)}
              >
                {transition.label}
              </Button>
            ))}
          </Group>
        )
      }
    >
      <Tabs defaultValue="details">
        <Tabs.List mb="md">
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="documentation">Documentation ({submissions.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
      <Stack gap="lg">
        {/* HEADER DETAILS */}
        <Card withBorder radius="md" padding="lg">
          <Group gap="xs" wrap="wrap" mb="md">
            <Badge variant="light">{request.requestNumber}</Badge>
            <StatusBadge value={request.status} kind="request" />
            <StatusBadge value={request.priority} kind="priority" />
            <Badge variant="light" color="grape">
              {formatEnum(request.requestType)}
            </Badge>
            <StatusBadge value={request.syncStatus} kind="sync" />
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
            <DetailRow
              label="Patient"
              value={
                <PatientLink mrn={request.patientId} label={request.patientName ?? undefined} />
              }
            />
            <DetailRow label="MRN" value={request.patientId} />
            {request.encounterId && (
              <DetailRow
                label="Encounter"
                value={
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    fw={500}
                    onClick={() => void navigate({ to: `/emr/encounters/${request.encounterId}` })}
                  >
                    View encounter
                  </Anchor>
                }
              />
            )}
            {request.visitId && (
              <DetailRow
                label="Visit"
                value={
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    fw={500}
                    onClick={() => void navigate({ to: `/emr/visits/${request.visitId}` })}
                  >
                    View visit
                  </Anchor>
                }
              />
            )}
            <DetailRow label="Ordering provider" value={request.orderingProviderName} />
            <DetailRow
              label="Requested"
              value={request.requestedAt ? new Date(request.requestedAt).toLocaleString() : undefined}
            />
            <DetailRow
              label="Completed"
              value={request.completedAt ? new Date(request.completedAt).toLocaleString() : undefined}
            />
            {request.externalOrderId && (
              <DetailRow label="External order ID" value={<CopyValue value={request.externalOrderId} />} />
            )}
            {request.externalReference && (
              <DetailRow label="External reference" value={<CopyValue value={request.externalReference} />} />
            )}
          </SimpleGrid>

          {request.diagnosis && (
            <Stack gap={2} mt="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Diagnosis
              </Text>
              <Text size="sm">{request.diagnosis}</Text>
            </Stack>
          )}
          {request.clinicalNotes && (
            <Stack gap={2} mt="md">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Clinical notes
              </Text>
              <Text size="sm">{request.clinicalNotes}</Text>
            </Stack>
          )}
        </Card>

        {/* STATUS TIMELINE */}
        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="sm">
            <Title order={4}>Activity</Title>
            <Text size="xs" c="dimmed">
              {request.statusHistory.length} event{request.statusHistory.length === 1 ? '' : 's'}
            </Text>
          </Group>
          <StatusTimeline history={request.statusHistory} />
          <RequestNoteComposer requestId={request.id} />
        </Card>

        {/* LINE ITEMS */}
        <Card withBorder radius="md" padding="lg">
          <Group justify="space-between" mb="sm">
            <Title order={4}>Line Items ({request.items.length})</Title>
            {request.syncError && (
              <Text size="xs" c="red">
                Sync error: {request.syncError}
              </Text>
            )}
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Item</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Dose</Table.Th>
                <Table.Th>Frequency</Table.Th>
                <Table.Th>Route</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Instructions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {request.items.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>No line items.</Table.Td>
                </Table.Tr>
              ) : (
                request.items.map((item, index) => (
                  <Table.Tr key={item.id ?? index}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {item.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>{item.code ?? '—'}</Table.Td>
                    <Table.Td>
                      {[item.dose, item.doseUnit].filter(Boolean).join(' ') || '—'}
                    </Table.Td>
                    <Table.Td>{item.frequency ?? '—'}</Table.Td>
                    <Table.Td>{item.route ?? '—'}</Table.Td>
                    <Table.Td>{item.quantity ?? '—'}</Table.Td>
                    <Table.Td>{item.instructions ?? '—'}</Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
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
                  <Table.Th>Encounter</Table.Th>
                  <Table.Th style={{ width: 120 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {submissions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      No documentation linked to this request's encounter or visit.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  submissions.map((row) => (
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
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* REASON MODAL for cancel/reject */}
      <Modal
        opened={reasonOpened}
        onClose={closeReason}
        title={pendingTransition?.label ?? 'Update request'}
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Provide a reason for this action. It will be recorded with the request.
          </Text>
          <Textarea
            label="Reason"
            required
            autosize
            minRows={2}
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeReason} disabled={transitionMutation.isPending}>
              Back
            </Button>
            <Button
              color="red"
              loading={transitionMutation.isPending}
              disabled={!reason.trim()}
              onClick={() => pendingTransition && runTransition(pendingTransition, reason.trim())}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
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
