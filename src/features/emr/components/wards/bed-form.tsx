import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import { BED_STATUSES, BED_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Bed } from '../../lib/emr-types';

export function BedForm({
  opened,
  onClose,
  wardId,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  wardId: string;
  initial?: Bed | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const form = useForm({
    initialValues: {
      code: initial?.code ?? '',
      bedType: initial?.bedType ?? 'STANDARD',
      status: initial?.status ?? 'AVAILABLE',
      notes: initial?.notes ?? '',
    },
    validate: {
      code: (value) => (value.trim() ? null : 'Bed code is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        code: values.code.trim(),
        bedType: values.bedType,
        status: values.status,
        notes: values.notes.trim() || undefined,
      };
      if (isEdit && initial) {
        const { data } = await emrApi.patch(`/beds/${initial.id}`, {
          ...payload,
          wardId,
        } as Record<string, unknown>);
        return data;
      }
      const { data } = await emrApi.post('/beds', { ...payload, wardId });
      return data;
    },
    onSuccess: () => {
      notifications.show({
        message: isEdit ? 'Bed updated' : 'Bed added',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['emr', 'beds'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'wards'] });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? `Edit Bed — ${initial?.code ?? ''}` : 'Add Bed'}
      centered
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack gap="sm">
          <Group align="flex-end" grow>
            <TextInput label="Bed code" required placeholder="e.g. B-101" {...form.getInputProps('code')} />
            <Select
              label="Bed type"
              placeholder="Select type"
              data={toSelectData(BED_TYPES)}
              {...form.getInputProps('bedType')}
            />
          </Group>
          <Select
            label="Status"
            placeholder="Select status"
            data={toSelectData(BED_STATUSES)}
            {...form.getInputProps('status')}
          />
          <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? 'Save Changes' : 'Add Bed'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}