import { ActionIcon, Button, Group, Menu, Modal, Stack, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

function useAppointmentMutation(successMessage: string, endpoint: string, body?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = body
        ? await emrApi.post(`/appointments/${endpoint}`, body)
        : await emrApi.post(`/appointments/${endpoint}`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: successMessage, color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });
}

type ConfirmState = 'checkIn' | 'complete' | 'noShow' | null;

export function AppointmentRowActions({ row }: { row: Record<string, unknown> }) {
  const status = String(row.status ?? 'SCHEDULED');
  const id = String(row.id ?? '');
  const [pending, setPending] = useState<ConfirmState>(null);
  const [cancelOpened, { open: openCancel, close: closeCancel }] = useDisclosure(false);
  const [cancelReason, setCancelReason] = useState('');

  const checkIn = useAppointmentMutation('Appointment checked in', `${id}/check-in`, {});
  const complete = useAppointmentMutation('Appointment completed', `${id}/complete`);
  const noShow = useAppointmentMutation('Appointment marked as no-show', `${id}/no-show`);
  const cancel = useAppointmentMutation('Appointment cancelled', `${id}/cancel`, {
    reason: cancelReason || undefined,
  });

  const run = (status: ConfirmState) => {
    if (status === 'checkIn') {
      checkIn.mutate();
    } else if (status === 'complete') {
      complete.mutate();
    } else if (status === 'noShow') {
      noShow.mutate();
    }
    setPending(null);
  };

  const closed = status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW' || status === 'MISSED';

  if (closed) {
    return <ActionIcon variant="subtle" color="gray" disabled aria-label="No actions"><MoreHorizontal size={16} /></ActionIcon>;
  }

  const patientLabel = String(row.patientName ?? row.patientId ?? 'this appointment');

  return (
    <>
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon variant="subtle" aria-label="Appointment actions">
            <MoreHorizontal size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {(status === 'SCHEDULED' || status === 'CHECKED_IN') && (
            <Menu.Item onClick={() => setPending('checkIn')}>Check in</Menu.Item>
          )}
          {status === 'IN_PROGRESS' && (
            <Menu.Item onClick={() => setPending('complete')}>Complete</Menu.Item>
          )}
          {status === 'SCHEDULED' && (
            <Menu.Item onClick={() => setPending('noShow')}>Mark no-show</Menu.Item>
          )}
          {status !== 'IN_PROGRESS' && (
            <Menu.Item color="red" onClick={openCancel}>
              Cancel appointment
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>

      <ConfirmDialog
        open={pending === 'checkIn'}
        onOpenChange={(open) => !open && setPending(null)}
        title="Check in patient"
        description={`Check in ${patientLabel}? This starts an outpatient visit.`}
        confirmText="Check in"
        isLoading={checkIn.isPending}
        onConfirm={() => run('checkIn')}
      />
      <ConfirmDialog
        open={pending === 'complete'}
        onOpenChange={(open) => !open && setPending(null)}
        title="Complete appointment"
        description={`Mark ${patientLabel}'s appointment as completed?`}
        confirmText="Complete"
        isLoading={complete.isPending}
        onConfirm={() => run('complete')}
      />
      <ConfirmDialog
        open={pending === 'noShow'}
        onOpenChange={(open) => !open && setPending(null)}
        title="Mark no-show"
        description={`Mark ${patientLabel}'s appointment as a no-show?`}
        confirmText="Mark no-show"
        destructive
        isLoading={noShow.isPending}
        onConfirm={() => run('noShow')}
      />

      <Modal opened={cancelOpened} onClose={closeCancel} title="Cancel appointment" centered>
        <Stack gap="sm">
          <TextInput
            label="Reason (optional)"
            placeholder="Why is this appointment being cancelled?"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeCancel} disabled={cancel.isPending}>
              Keep appointment
            </Button>
            <Button
              color="red"
              loading={cancel.isPending}
              onClick={() => cancel.mutate(undefined, { onSuccess: closeCancel })}
            >
              Cancel appointment
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}