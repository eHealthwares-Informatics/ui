import { Button, Group, Modal, Select, Stack, Switch, TextInput, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import { WARD_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Ward } from '../../lib/emr-types';

export function WardForm({
  opened,
  onClose,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  initial?: Ward | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(initial);

  const form = useForm({
    initialValues: {
      code: initial?.code ?? '',
      name: initial?.name ?? '',
      wardType: initial?.wardType ?? 'GENERAL',
      departmentId: initial?.departmentId ?? '',
      departmentType: initial?.departmentType ?? '',
      description: initial?.description ?? '',
      isActive: initial?.isActive ?? true,
    },
    validate: {
      code: (value) => (value.trim() ? null : 'Code is required'),
      name: (value) => (value.trim() ? null : 'Name is required'),
      wardType: (value) => (value ? null : 'Ward type is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
        wardType: values.wardType,
        departmentId: values.departmentId.trim() || undefined,
        departmentType: values.departmentType.trim() || undefined,
        description: values.description.trim() || undefined,
        isActive: values.isActive,
      };
      if (isEdit && initial) {
        const { data } = await emrApi.patch(`/wards/${initial.id}`, payload);
        return data;
      }
      const { data } = await emrApi.post('/wards', payload);
      return data;
    },
    onSuccess: () => {
      notifications.show({
        message: isEdit ? 'Ward updated' : 'Ward created',
        color: 'teal',
      });
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
      title={isEdit ? `Edit Ward — ${initial?.name ?? ''}` : 'New Ward'}
      centered
    >
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack gap="sm">
          <Group align="flex-end" grow>
            <TextInput label="Code" required placeholder="e.g. W3A" {...form.getInputProps('code')} />
            <TextInput label="Name" required placeholder="e.g. Male General Ward" {...form.getInputProps('name')} />
          </Group>
          <Group align="flex-end" grow>
            <Select
              label="Ward type"
              required
              placeholder="Select type"
              data={toSelectData(WARD_TYPES)}
              {...form.getInputProps('wardType')}
            />
            <TextInput
              label="Department type"
              placeholder="e.g. INPATIENT"
              {...form.getInputProps('departmentType')}
            />
          </Group>
          <TextInput
            label="Department id"
            placeholder="Owning department id (optional)"
            {...form.getInputProps('departmentId')}
          />
          <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
          <Switch label="Active" {...form.getInputProps('isActive', { type: 'checkbox' })} />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? 'Save Changes' : 'Create Ward'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}