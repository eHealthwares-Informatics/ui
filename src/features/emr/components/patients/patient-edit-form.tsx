import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { emrApi } from '@/lib/emr-api';
import {
  BLOOD_GROUPS,
  GENDERS,
  GENOTYPES,
  MARITAL_STATUSES,
  NEXT_OF_KIN_RELATIONSHIPS,
  toSelectData,
} from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { PatientDetail } from '../../lib/emr-types';
import { PaymentProvidersPicker } from '../shared/payment-providers-picker';

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value != null),
  );
}

type FormValues = {
  firstName: string;
  lastName: string;
  otherNames: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  maritalStatus: string;
  occupation: string;
  bloodGroup: string;
  genotype: string;
  paymentProviderIds: string[];
  isActive: boolean;
};

function valuesFrom(patient: PatientDetail): FormValues {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    otherNames: patient.otherNames ?? '',
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    nextOfKinName: patient.nextOfKinName ?? '',
    nextOfKinPhone: patient.nextOfKinPhone ?? '',
    nextOfKinRelationship: patient.nextOfKinRelationship ?? '',
    maritalStatus: patient.maritalStatus ?? '',
    occupation: patient.occupation ?? '',
    bloodGroup: patient.bloodGroup ?? '',
    genotype: patient.genotype ?? '',
    paymentProviderIds: Array.isArray(patient.paymentProviderIds) ? patient.paymentProviderIds : [],
    isActive: patient.isActive,
  };
}

export function PatientEditForm({
  opened,
  onClose,
  onSaved,
  initial,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  initial?: PatientDetail | null;
}) {
  const queryClient = useQueryClient();
  const [confirmDiscard, { open: openDiscard, close: closeDiscard }] = useDisclosure(false);

  const form = useForm<FormValues>({
    initialValues: valuesFrom(initial ?? ({} as PatientDetail)),
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required'),
      lastName: (value) => (value.trim() ? null : 'Last name is required'),
      email: (value) =>
        value && !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email address' : null,
    },
  });

  // Pre-fill the form whenever the modal opens with the current patient.
  useEffect(() => {
    if (opened && initial) {
      form.setValues(valuesFrom(initial));
      form.resetDirty(valuesFrom(initial));
    }
  }, [opened, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!initial) {
        throw new Error('Patient is required');
      }
      const { data } = await emrApi.patch(`/patients/${initial.id}`, compact(values));
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Patient updated', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'patients'] });
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
    <Modal opened={opened} onClose={requestClose} title="Edit Patient" size="lg" centered>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="First name" required {...form.getInputProps('firstName')} />
            <TextInput label="Last name" required {...form.getInputProps('lastName')} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Other names" {...form.getInputProps('otherNames')} />
            <Select
              label="Gender"
              data={toSelectData(GENDERS)}
              clearable
              {...form.getInputProps('gender')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Date of birth" type="date" {...form.getInputProps('dateOfBirth')} />
            <TextInput label="Phone" {...form.getInputProps('phone')} />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Email" {...form.getInputProps('email')} />
            <Select
              label="Marital status"
              data={toSelectData(MARITAL_STATUSES)}
              clearable
              {...form.getInputProps('maritalStatus')}
            />
          </SimpleGrid>

          <TextInput label="Address" {...form.getInputProps('address')} />

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Occupation" {...form.getInputProps('occupation')} />
            <Select
              label="Blood group"
              data={[...BLOOD_GROUPS]}
              clearable
              {...form.getInputProps('bloodGroup')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Genotype"
              data={[...GENOTYPES]}
              clearable
              {...form.getInputProps('genotype')}
            />
            <Select
              label="Next of kin relationship"
              data={toSelectData(NEXT_OF_KIN_RELATIONSHIPS)}
              clearable
              {...form.getInputProps('nextOfKinRelationship')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Next of kin name" {...form.getInputProps('nextOfKinName')} />
            <TextInput label="Next of kin phone" {...form.getInputProps('nextOfKinPhone')} />
          </SimpleGrid>

          <Switch
            label="Active"
            description="Inactive patients are hidden from search results."
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />

          <PaymentProvidersPicker
            value={form.values.paymentProviderIds}
            onChange={(next) => form.setFieldValue('paymentProviderIds', next)}
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
            You have unsaved changes to this patient's demographics. If you close now, they will be
            lost.
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
