import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { emrApi } from '@/lib/emr-api';
import { DEPARTMENT_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Department } from '../../lib/emr-types';
import { LocationPicker } from '../shared/location-picker';

type FormValues = {
  code: string;
  name: string;
  departmentType: string;
  description: string;
  locationId: string;
  isActive: boolean;
};

function valuesFrom(department: Department): FormValues {
  return {
    code: department.code,
    name: department.name,
    departmentType: department.departmentType,
    description: department.description ?? '',
    locationId: department.locationId ?? '',
    isActive: department.isActive,
  };
}

export function DepartmentEditForm({
  opened,
  onClose,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  initial: Department | null;
}) {
  const queryClient = useQueryClient();
  const [confirmDiscard, { open: openDiscard, close: closeDiscard }] = useDisclosure(false);

  const form = useForm<FormValues>({
    initialValues: valuesFrom(initial ?? ({} as Department)),
    validate: {
      code: (value) => (value.trim() ? null : 'Code is required'),
      name: (value) => (value.trim() ? null : 'Name is required'),
      departmentType: (value) => (value ? null : 'Department type is required'),
    },
  });

  useEffect(() => {
    if (opened && initial) {
      form.setValues(valuesFrom(initial));
      form.resetDirty(valuesFrom(initial));
    }
  }, [opened, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!initial) {
        throw new Error('Department is required');
      }
      const { data } = await emrApi.patch(`/departments/${initial.id}`, {
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
      notifications.show({ message: 'Department updated', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'departments'] });
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const requestClose = () => {
    if (form.isDirty() && !mutation.isPending) {
      openDiscard();
    } else {
      onClose();
    }
  };

  return (
    <Modal opened={opened} onClose={requestClose} title="Edit Department" size="lg" centered>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Code" required {...form.getInputProps('code')} />
            <Select
              label="Type"
              required
              placeholder="Select department type"
              data={toSelectData(DEPARTMENT_TYPES)}
              {...form.getInputProps('departmentType')}
            />
          </SimpleGrid>

          <TextInput label="Name" required {...form.getInputProps('name')} />

          <Textarea
            label="Description"
            autosize
            minRows={2}
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
            <Button variant="light" onClick={requestClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        opened={confirmDiscard}
        onClose={closeDiscard}
        title="Discard unsaved changes?"
        size="sm"
        centered
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            You have unsaved changes to this department. If you close now, they will be lost.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeDiscard} autoFocus>
              Keep editing
            </Button>
            <Button color="red" onClick={onClose}>
              Discard changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
}