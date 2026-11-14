import {
  Alert,
  Button,
  Divider,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { PRIORITIES, REQUEST_TYPES, toSelectData } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { FormDefinition } from '../../lib/emr-types';
import { formDataToRequestItems } from '../../lib/request-form-items';
import {
  DynamicFormFields,
  buildInitialFormData,
  validateFormData,
  type FormData,
} from '../documentation/dynamic-form';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import { StaffPicker, type StaffOption } from '../shared/staff-picker';

/**
 * Request capture is form-driven: each request type has a published REQUEST
 * form (seeded as REQUEST_PRESCRIPTION / REQUEST_LAB / REQUEST_RADIOLOGY /
 * REQUEST_OTHER_TEST) whose item table mirrors the old inline editor. There is
 * no hardcoded fallback — a type without a published form cannot be submitted.
 */
export function RequestForm({
  onCreated,
  onClose,
  initialPatient,
  submitUrl,
  lockPatient = false,
  visitId,
}: {
  onCreated?: (created?: Record<string, unknown>) => void;
  onClose: () => void;
  initialPatient?: PatientOption | null;
  submitUrl?: string;
  lockPatient?: boolean;
  /** Links the request to a visit (encounters/requests attach to visits). */
  visitId?: string;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(initialPatient ?? null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [orderingProvider, setOrderingProvider] = useState<StaffOption | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const form = useForm({
    initialValues: {
      requestType: '',
      priority: 'ROUTINE',
      diagnosis: '',
      clinicalNotes: '',
      requestedAt: '',
      pharmacySyncTarget: 'prescription',
    },
    validate: {
      requestType: (value) => (value ? null : 'Request type is required'),
    },
  });

  const requestType = form.values.requestType;

  const formQuery = useQuery({
    queryKey: ['emr', 'request-form', requestType],
    queryFn: async () => {
      const { data } = await emrApi.get<{ data: FormDefinition[] }>('/form-definitions', {
        params: { category: 'REQUEST', requestType, published: 'true', limit: 1 },
      });
      return data?.data?.[0] ?? null;
    },
    enabled: Boolean(requestType),
    staleTime: 60_000,
  });

  const requestForm = formQuery.data ?? null;

  // Switching type swaps the schema: seed the new form's defaults during render
  // (the "adjust state when props change" pattern) so the first paint already
  // shows the right controls.
  const [initialisedFor, setInitialisedFor] = useState<string | null>(null);
  const requestFormId = requestForm?.id ?? null;
  if (requestForm && initialisedFor !== requestFormId) {
    setInitialisedFor(requestFormId);
    setFormData(buildInitialFormData(requestForm.schemaJson));
    setFormErrors([]);
  }

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      if (!requestForm) {
        const message = requestFormId
          ? 'No request form is published for this request type'
          : 'Select a request type';
        setFormErrors([message]);
        throw new Error(message);
      }

      const errors = validateFormData(requestForm.schemaJson, formData);
      const items = formDataToRequestItems(requestForm.schemaJson, formData);
      if (items.length === 0) {
        errors.push('Add at least one item');
      }
      if (errors.length > 0) {
        setFormErrors(errors);
        throw new Error(errors[0]);
      }
      setFormErrors([]);

      const { data } = await emrApi.post(submitUrl ?? '/requests', {
        patientId: patient.patientId,
        patientName: patient.patientName || undefined,
        visitId: visitId || undefined,
        requestType: values.requestType,
        priority: values.priority,
        orderingProviderId: orderingProvider?.id ?? undefined,
        orderingProviderName: orderingProvider?.staffName || undefined,
        diagnosis: values.diagnosis || undefined,
        clinicalNotes: values.clinicalNotes || undefined,
        requestedAt: values.requestedAt || undefined,
        // Only prescriptions have a pharmacy destination; lab/imaging ignore it.
        pharmacySyncTarget:
          values.requestType === 'PRESCRIPTION'
            ? values.pharmacySyncTarget || undefined
            : undefined,
        formDefinitionId: requestForm.id,
        formData,
        items,
      });
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Clinical request created', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'requests'] });
      onCreated?.();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack gap="sm">
        <PatientPicker
          value={patient}
          onChange={(next) => {
            setPatient(next);
            if (next) {
              setPatientError(null);
            }
          }}
          required
          disabled={lockPatient}
          error={patientError}
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Request type"
            required
            placeholder="Select type"
            data={toSelectData(REQUEST_TYPES)}
            data-testid="request-form-type"
            value={form.values.requestType}
            onChange={(value) => {
              form.setFieldValue('requestType', value ?? '');
              // A new type means a new form: drop the previous answers so they
              // are neither validated nor stored against this request.
              setInitialisedFor(null);
              setFormData({});
              setFormErrors([]);
            }}
          />
          <Select
            label="Priority"
            placeholder="Select priority"
            data={toSelectData(PRIORITIES)}
            {...form.getInputProps('priority')}
          />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <StaffPicker
            value={orderingProvider}
            onChange={setOrderingProvider}
            label="Ordering provider"
          />
          <TextInput
            label="Requested at"
            type="datetime-local"
            {...form.getInputProps('requestedAt')}
          />
        </SimpleGrid>
        {form.values.requestType === 'PRESCRIPTION' && (
          <Select
            label="Send to pharmacy as"
            description="Prescription lands in the pharmacist transcription queue; order goes straight to the dispense queue."
            data={[
              { value: 'prescription', label: 'Prescription (transcribe & verify)' },
              { value: 'order', label: 'Pharmacy order (dispense queue)' },
            ]}
            data-testid="request-pharmacy-sync-target"
            {...form.getInputProps('pharmacySyncTarget')}
          />
        )}
        <TextInput
          label="Diagnosis"
          placeholder="Working diagnosis"
          {...form.getInputProps('diagnosis')}
        />
        <Textarea
          label="Clinical notes"
          autosize
          minRows={2}
          {...form.getInputProps('clinicalNotes')}
        />

        <Divider label="Items" labelPosition="left" />

        {!requestType ? (
          <Text size="sm" c="dimmed">
            Select a request type to load its form.
          </Text>
        ) : formQuery.isLoading ? (
          <Group gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading the {requestType.toLowerCase()} request form…
            </Text>
          </Group>
        ) : !requestForm ? (
          <Alert color="red" icon={<AlertCircle size={16} />} data-testid="request-form-missing">
            No request form is published for {requestType.toLowerCase()}. Ask an administrator to
            publish one under Forms → Requests.
          </Alert>
        ) : (
          <div data-testid="request-form-fields">
            <DynamicFormFields
              schema={requestForm.schemaJson}
              value={formData}
              onChange={setFormData}
            />
          </div>
        )}

        {formErrors.length > 0 && (
          <Alert color="red" icon={<AlertCircle size={16} />} data-testid="request-form-errors">
            <Stack gap={2}>
              {formErrors.map((error) => (
                <Text key={error} size="sm">
                  {error}
                </Text>
              ))}
            </Stack>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={Boolean(requestType) && (formQuery.isLoading || !requestForm)}
            data-testid="request-form-submit"
          >
            Create Request
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
