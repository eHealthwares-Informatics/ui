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
import { STAFF_CATEGORIES, STAFF_ROLE_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Staff } from '../../lib/emr-types';
import { LocationPicker } from '../shared/location-picker';
import { DepartmentPicker } from '../departments/department-picker';

type FormValues = {
  firstName: string;
  lastName: string;
  otherNames: string;
  roleType: string;
  category: string;
  department: string;
  departmentId: string;
  email: string;
  phone: string;
  hireDate: string;
  identityLocationId: string;
  userId: string;
  isActive: boolean;
  otherDetails: string;
};

function valuesFrom(staff: Staff): FormValues {
  return {
    firstName: staff.firstName,
    lastName: staff.lastName,
    otherNames: staff.otherNames ?? '',
    roleType: staff.roleType,
    category: staff.category ?? '',
    department: staff.department ?? '',
    departmentId: staff.departmentId ?? '',
    email: staff.email ?? '',
    phone: staff.phone ?? '',
    hireDate: staff.hireDate ?? '',
    identityLocationId: staff.identityLocationId ?? '',
    userId: staff.userId ?? '',
    isActive: staff.isActive,
    otherDetails: staff.otherDetails ? JSON.stringify(staff.otherDetails, null, 2) : '',
  };
}

function compact(values: FormValues): Record<string, unknown> {
  let otherDetails: Record<string, unknown> | undefined;
  if (values.otherDetails.trim()) {
    try {
      otherDetails = JSON.parse(values.otherDetails);
    } catch {
      return { __jsonError: 'Other details must be valid JSON' };
    }
  }
  return {
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
  };
}

export function StaffEditForm({
  opened,
  onClose,
  onSaved,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Staff | null;
}) {
  const queryClient = useQueryClient();
  const [confirmDiscard, { open: openDiscard, close: closeDiscard }] = useDisclosure(false);

  const form = useForm<FormValues>({
    initialValues: valuesFrom(initial ?? ({} as Staff)),
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required'),
      lastName: (value) => (value.trim() ? null : 'Last name is required'),
      roleType: (value) => (value ? null : 'Role type is required'),
      email: (value) => (value && !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email address' : null),
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
        throw new Error('Staff member is required');
      }
      const payload = compact(values);
      if ('__jsonError' in payload) {
        throw new Error(String(payload.__jsonError));
      }
      delete payload.__jsonError;
      const { data } = await emrApi.patch(`/staff/${initial.id}`, payload);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Staff member updated', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'staff'] });
      onSaved?.();
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
    <Modal opened={opened} onClose={requestClose} title="Edit Staff" size="lg" centered>
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
            You have unsaved changes to this staff member. If you close now, they will be lost.
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
