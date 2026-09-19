import { Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { appointmentsConfig } from '../../registry/appointments';
import { AppointmentForm } from '../../components/appointments/appointment-form';
import { AppointmentRowActions } from '../../components/appointments/appointment-actions';
import { PrintAppointmentButton } from '../../components/appointments/print-appointment';

export function AppointmentsPage() {
  const [opened, { open, close }] = useDisclosure(false);

  const config = useMemo(
    () => ({
      ...appointmentsConfig,
      renderHeaderActions: () => (
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Schedule Appointment
        </Button>
      ),
      columns: [
        ...appointmentsConfig.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => (
            <Group gap={4} wrap="nowrap">
              <PrintAppointmentButton appointmentId={String(row.id)} />
              <AppointmentRowActions row={row} />
            </Group>
          ),
        },
      ],
    }),
    [open],
  );

  return (
    <>
      <DataPageShell config={config as typeof appointmentsConfig} />
      <Modal opened={opened} onClose={close} title="Schedule Appointment" size="lg" centered>
        <AppointmentForm onClose={close} />
      </Modal>
    </>
  );
}