import { Modal, Stack, Text, Loader, Divider, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import { formatEnum } from '../../lib/emr-constants';
import { PatientHoverCard } from '../shared/patient-hover-card';
import { StatusBadge } from '../shared/status-badge';

type AppointmentRow = Record<string, unknown>;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
        {label}
      </Text>
      <Text size="sm" ta="right">
        {value ?? '—'}
      </Text>
    </Group>
  );
}

/**
 * Read-only appointment detail: appointment fields, the linked visit (if
 * check-in happened) and the encounters recorded against that visit.
 */
export function AppointmentViewModal({
  row,
  onClose,
}: {
  row: AppointmentRow;
  onClose: () => void;
}) {
  const visitId = row.visitId ? String(row.visitId) : null;

  const visitQuery = useQuery({
    queryKey: ['emr', 'visit', visitId],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Record<string, unknown> }>(`/visits/${visitId}`);
      return res.data.data;
    },
    enabled: Boolean(visitId),
  });

  const encountersQuery = useQuery({
    queryKey: ['emr', 'encounters', 'by-visit', visitId],
    queryFn: async () => {
      const res = await emrApi.get<{
        data: Array<Record<string, unknown>>;
      }>('/encounters', { params: { visitId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' } });
      return res.data.data;
    },
    enabled: Boolean(visitId),
  });

  const fmt = (value: unknown) => {
    if (!value) {
      return '—';
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={`Appointment ${String(row.appointmentNumber ?? '')}`}
      size="lg"
      centered
    >
      <Stack gap="sm">
        <Field
          label="Patient"
          value={
            <PatientHoverCard
              mrn={String(row.patientId ?? '')}
              label={String(row.patientName ?? '—')}
            />
          }
        />
        <Field label="Type" value={formatEnum(String(row.appointmentType ?? '—'))} />
        <Field label="Date" value={String(row.date ?? '—')} />
        <Field
          label="Time"
          value={`${String(row.startTime ?? '—')}${row.endTime ? ` – ${String(row.endTime)}` : ''}`}
        />
        <Field label="Provider" value={String(row.providerName ?? '—')} />
        <Field label="Priority" value={<StatusBadge value={row.priority} kind="priority" />} />
        <Field label="Status" value={<StatusBadge value={row.status} kind="appointment" />} />
        <Field label="Location" value={String(row.scheduleLocation ?? '—')} />
        {row.reason ? <Field label="Reason" value={String(row.reason)} /> : null}
        {row.notes ? <Field label="Notes" value={String(row.notes)} /> : null}

        <Divider label="Visit" labelPosition="left" />
        {!visitId ? (
          <Text size="sm" c="dimmed">
            No visit started yet.
          </Text>
        ) : visitQuery.isLoading ? (
          <Loader size="sm" type="dots" />
        ) : visitQuery.data ? (
          <Stack gap="xs">
            <Field
              label="Visit #"
              value={String(visitQuery.data.visitNumber ?? visitQuery.data.id)}
            />
            <Field
              label="Visit type"
              value={formatEnum(String(visitQuery.data.visitType ?? '—'))}
            />
            <Field label="Started" value={fmt(visitQuery.data.startDatetime)} />
            <Field
              label="Visit status"
              value={<StatusBadge value={visitQuery.data.status} kind="visit" />}
            />
          </Stack>
        ) : (
          <Text size="sm" c="red">
            Could not load visit.
          </Text>
        )}

        {visitId ? (
          <>
            <Divider label="Encounters" labelPosition="left" />
            {encountersQuery.isLoading ? (
              <Loader size="sm" type="dots" />
            ) : (encountersQuery.data ?? []).length === 0 ? (
              <Text size="sm" c="dimmed">
                No encounters recorded for this visit.
              </Text>
            ) : (
              <Stack gap="xs">
                {(encountersQuery.data ?? []).map((encounter) => (
                  <Field
                    key={String(encounter.id)}
                    label={fmt(encounter.encounterDatetime ?? encounter.createdAt)}
                    value={formatEnum(String(encounter.encounterType ?? encounter.status ?? '—'))}
                  />
                ))}
              </Stack>
            )}
          </>
        ) : null}
      </Stack>
    </Modal>
  );
}
