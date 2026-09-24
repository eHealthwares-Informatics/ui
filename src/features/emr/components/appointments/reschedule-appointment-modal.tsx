import { Button, Group, Modal, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';

export function RescheduleAppointmentModal({
  row,
  opened,
  onClose,
}: {
  row: Record<string, unknown>;
  opened: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const id = String(row.id ?? '');

  const form = useForm({
    initialValues: {
      date: String(row.date ?? ''),
      startTime: String(row.startTime ?? ''),
      endTime: String(row.endTime ?? ''),
    },
    validate: {
      date: (value) => (value ? null : 'Date is required'),
      startTime: (value) => (value ? null : 'Start time is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const { data } = await emrApi.post(`/appointments/${id}/reschedule`, {
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime || undefined,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Appointment rescheduled', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'dashboard'] });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Reschedule Appointment" centered>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <TextInput label="Date" required type="date" {...form.getInputProps('date')} />
            <TextInput label="Start time" required type="time" {...form.getInputProps('startTime')} />
            <TextInput label="End time" type="time" {...form.getInputProps('endTime')} />
          </SimpleGrid>
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Reschedule
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
