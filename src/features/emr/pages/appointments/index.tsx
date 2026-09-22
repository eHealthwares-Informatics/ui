import { Group } from '@mantine/core';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { AppointmentRowActions } from '../../components/appointments/appointment-actions';
import { AppointmentForm } from '../../components/appointments/appointment-form';
import { BeginVisitButton } from '../../components/appointments/begin-visit-button';
import { PrintAppointmentButton } from '../../components/appointments/print-appointment';
import { appointmentsConfig } from './schema';

export function AppointmentsPage() {
  const config = useMemo(
    () => ({
      ...appointmentsConfig,
      renderCreateModal: ({ onClose }: { onClose: () => void }) => (
        <AppointmentForm onClose={onClose} />
      ),
      columns: [
        ...appointmentsConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              {row.status === 'SCHEDULED' && <BeginVisitButton appointmentId={String(row.id)} />}
              <PrintAppointmentButton appointmentId={String(row.id)} />
              <AppointmentRowActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    []
  );

  return <DataPageShell config={config as typeof appointmentsConfig} />;
}
