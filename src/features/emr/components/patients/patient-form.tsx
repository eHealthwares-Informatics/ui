import { Button, Group, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import {
  BLOOD_GROUPS,
  GENDERS,
  GENOTYPES,
  MARITAL_STATUSES,
  toSelectData,
} from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PaymentProvidersPicker } from '../shared/payment-providers-picker';

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value != null)
  );
}

export function PatientForm({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      otherNames: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      address: '',
      nextOfKinName: '',
      nextOfKinPhone: '',
      nextOfKinRelationship: '',
      maritalStatus: '',
      occupation: '',
      bloodGroup: '',
      genotype: '',
      paymentProviderIds: [] as string[],
    },
    validate: {
      firstName: (value) => (value.trim() ? null : 'First name is required'),
      lastName: (value) => (value.trim() ? null : 'Last name is required'),
      email: (value) => (value && !/^\S+@\S+\.\S+$/.test(value) ? 'Invalid email address' : null),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const { data } = await emrApi.post('/patients', compact(values));
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Patient registered successfully', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'patients'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'patients', 'picker'] });
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
          <TextInput
            label="First name"
            required
            placeholder="Jane"
            {...form.getInputProps('firstName')}
          />
          <TextInput
            label="Last name"
            required
            placeholder="Doe"
            {...form.getInputProps('lastName')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Other names"
            placeholder="Middle names"
            {...form.getInputProps('otherNames')}
          />
          <Select
            label="Gender"
            placeholder="Select gender"
            data={toSelectData(GENDERS)}
            clearable
            {...form.getInputProps('gender')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Date of birth" type="date" {...form.getInputProps('dateOfBirth')} />
          <TextInput label="Phone" placeholder="+2547..." {...form.getInputProps('phone')} />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Email"
            placeholder="jane@example.com"
            {...form.getInputProps('email')}
          />
          <Select
            label="Marital status"
            placeholder="Select"
            data={toSelectData(MARITAL_STATUSES)}
            clearable
            {...form.getInputProps('maritalStatus')}
          />
        </SimpleGrid>

        <TextInput
          label="Address"
          placeholder="Physical address"
          {...form.getInputProps('address')}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Occupation" {...form.getInputProps('occupation')} />
          <Select
            label="Blood group"
            placeholder="Select"
            data={[...BLOOD_GROUPS]}
            clearable
            {...form.getInputProps('bloodGroup')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Genotype"
            placeholder="Select"
            data={[...GENOTYPES]}
            clearable
            {...form.getInputProps('genotype')}
          />
        </SimpleGrid>

        <PaymentProvidersPicker
          value={form.values.paymentProviderIds}
          onChange={(next) => form.setFieldValue('paymentProviderIds', next)}
        />

        <Textarea
          label="Next of kin"
          autosize
          minRows={1}
          rows={2}
          placeholder="Name, phone and relationship"
          {...form.getInputProps('nextOfKinName')}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Register Patient
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
