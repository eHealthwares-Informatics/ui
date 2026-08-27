import {
  Button,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import { DEPARTMENT_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { LocationPicker } from '../shared/location-picker';

export function DepartmentForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      code: '',
      name: '',
      departmentType: '',
      description: '',
      locationId: '',
      isActive: true,
    },
    validate: {
      code: (value) => (value.trim() ? null : 'Code is required'),
      name: (value) => (value.trim() ? null : 'Name is required'),
      departmentType: (value) => (value ? null : 'Department type is required'),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const { data } = await emrApi.post('/departments', {
        code: values.code.trim().toUpperCase().replace(/\s+/g, '_'),
        name: values.name.trim(),
        departmentType: values.departmentType,
        description: values.description.trim() || undefined,
        locationId: values.locationId.trim() || undefined,
        isActive: values.isActive,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Department created', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'departments'] });
      onCreated();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Code" required placeholder="e.g. CARDIOLOGY" {...form.getInputProps('code')} />
          <Select
            label="Type"
            required
            placeholder="Select department type"
            data={toSelectData(DEPARTMENT_TYPES)}
            {...form.getInputProps('departmentType')}
          />
        </SimpleGrid>

        <TextInput label="Name" required placeholder="e.g. Cardiology Department" {...form.getInputProps('name')} />

        <Textarea
          label="Description"
          autosize
          minRows={2}
          placeholder="What does this department do?"
          {...form.getInputProps('description')}
        />

        <LocationPicker
          label="Location (site)"
          placeholder="Identity site the department belongs to"
          value={form.values.locationId || null}
          onChange={(id) => form.setFieldValue('locationId', id ?? '')}
        />

        <Switch
          label="Active"
          description="Inactive departments are hidden from pickers."
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Create Department
          </Button>
        </Group>
      </Stack>
    </form>
  );
}