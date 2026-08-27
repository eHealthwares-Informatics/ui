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
import { STAFF_CATEGORIES, STAFF_ROLE_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { LocationPicker } from '../shared/location-picker';
import { DepartmentPicker } from '../departments/department-picker';

export function StaffForm({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      otherNames: '',
      roleType: '',
      category: '',
      department: '',
      departmentId: '',
      email: '',
      phone: '',
      hireDate: '',
      identityLocationId: '',
      userId: '',
      isActive: true,
      otherDetails: '',
    },
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required'),
      lastName: (value) => (value.trim() ? null : 'Last name is required'),
      roleType: (value) => (value ? null : 'Role type is required'),
      email: (value) => (value && !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email address' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      let otherDetails: Record<string, unknown> | undefined;
      if (values.otherDetails.trim()) {
        try {
          otherDetails = JSON.parse(values.otherDetails);
        } catch {
          throw new Error('Other details must be valid JSON');
        }
      }
      const { data } = await emrApi.post('/staff', {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        otherNames: values.otherNames.trim() || undefined,
        roleType: values.roleType,
        category: values.category || undefined,
        department: values.department.trim() || undefined,
        departmentId: values.departmentId.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        hireDate: values.hireDate || undefined,
        identityLocationId: values.identityLocationId.trim() || undefined,
        userId: values.userId.trim() || undefined,
        isActive: values.isActive,
        otherDetails,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Staff member registered', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'staff'] });
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
          <TextInput label="First name" required {...form.getInputProps('firstName')} />
          <TextInput label="Last name" required {...form.getInputProps('lastName')} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Other names" {...form.getInputProps('otherNames')} />
          <Select
            label="Role type"
            required
            placeholder="Select role"
            data={toSelectData(STAFF_ROLE_TYPES)}
            {...form.getInputProps('roleType')}
          />
          <Select
            label="Category"
            placeholder="Select category"
            data={toSelectData(STAFF_CATEGORIES)}
            clearable
            {...form.getInputProps('category')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <DepartmentPicker
            label="Department"
            placeholder="Search department name or code"
            value={
              form.values.departmentId
                ? { id: form.values.departmentId, name: form.values.department || null }
                : null
            }
            onChange={(selection) => {
              form.setValues((prev) => ({
                ...prev,
                departmentId: selection.id ?? '',
                department: selection.name ?? prev.department,
              }));
            }}
          />
          <TextInput label="Phone" {...form.getInputProps('phone')} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Email" {...form.getInputProps('email')} />
          <TextInput label="Hire date" type="date" {...form.getInputProps('hireDate')} />
          <TextInput
            label="User id (login)"
            placeholder="Identity user id"
            {...form.getInputProps('userId')}
          />
        </SimpleGrid>

        <LocationPicker
          label="Location"
          placeholder="Search location name or code"
          value={form.values.identityLocationId || null}
          onChange={(id) => form.setFieldValue('identityLocationId', id ?? '')}
        />

        <Textarea
          label="Other details (JSON)"
          autosize
          minRows={2}
          placeholder='e.g. {"specialty": "Cardiology", "licenseNo": "..."}'
          {...form.getInputProps('otherDetails')}
        />

        <Switch
          label="Active"
          description="Inactive staff are hidden from provider searches."
          {...form.getInputProps('isActive', { type: 'checkbox' })}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Register Staff
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
