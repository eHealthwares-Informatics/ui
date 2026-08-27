import {
  Alert,
  Badge,
  Button,
  Group,
  Grid,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import type { FormDefinition } from '../../lib/emr-types';
import { formatEnum } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';
import {
  DynamicFormFields,
  buildInitialFormData,
  validateFormData,
  type FormData,
} from './dynamic-form';

export type ActiveEncounter = {
  id: string;
  encounterNumber: string;
  patientId: string;
  patientName: string | null;
  encounterType: string;
  providerName: string | null;
  encounterDatetime: string;
};

export function DocumentationModal({
  opened,
  onClose,
  activeEncounter,
  initialPatient,
  onSubmitted,
}: {
  opened: boolean;
  onClose: () => void;
  activeEncounter?: ActiveEncounter | null;
  initialPatient?: PatientOption | null;
  onSubmitted?: () => void;
}) {
  const queryClient = useQueryClient();

  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({});

  // Server-enforced list of forms the current user may open (GET /forms/available).
  const { data: accessibleForms = [], isLoading } = useQuery({
    queryKey: ['emr', 'forms', 'available'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: FormDefinition[] }>('/forms/available');
      return res.data.data;
    },
    enabled: opened,
    staleTime: 30_000,
  });

  // Prefill the patient (from the active encounter, or a provided patient) and
  // reset the form when the popup opens.
  useEffect(() => {
    if (!opened) {
      return;
    }
    if (activeEncounter?.patientId) {
      setPatient({
        id: activeEncounter.id,
        patientId: activeEncounter.patientId,
        patientName: activeEncounter.patientName ?? '',
      });
      setPatientError(null);
    } else if (initialPatient) {
      setPatient(initialPatient);
      setPatientError(null);
    }
    setSelectedFormId(null);
    setData({});
  }, [opened, activeEncounter, initialPatient]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select the first accessible form once the list loads.
  useEffect(() => {
    if (accessibleForms.length > 0 && !selectedFormId) {
      setSelectedFormId(accessibleForms[0].id);
    }
  }, [accessibleForms, selectedFormId]);

  const selectedForm = accessibleForms.find((form) => form.id === selectedFormId) ?? null;

  // Build field values from schema defaults when the selected form changes.
  useEffect(() => {
    setData(selectedForm ? buildInitialFormData(selectedForm.schemaJson) : {});
  }, [selectedFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async ({ status }: { status: 'DRAFT' | 'SUBMITTED' }) => {
      if (!selectedForm) {
        throw new Error('Select a form first');
      }
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      if (status === 'SUBMITTED') {
        const errors = validateFormData(selectedForm.schemaJson, data);
        if (errors.length > 0) {
          throw new Error(`Please fix the form: ${errors.join('; ')}`);
        }
      }
      const { data: res } = await emrApi.post('/form-submissions', {
        formDefinitionId: selectedForm.id,
        patientId: patient.patientId,
        encounterId: activeEncounter?.id ?? undefined,
        dataJson: data,
        status,
      });
      return res;
    },
    onSuccess: () => {
      notifications.show({
        message: 'Documentation submitted successfully',
        color: 'teal',
      });
      queryClient.invalidateQueries({ queryKey: ['emr', 'form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'forms'] });
      onSubmitted?.();
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
      title="Create Documentation"
      size="xl"
      centered
    >
      {isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : accessibleForms.length === 0 ? (
        <Alert color="yellow" icon={<AlertCircle size={16} />} title="No forms available">
          There are no published forms you have access to. Ask an administrator to publish a form
          definition or update the user form config.
        </Alert>
      ) : (
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Text size="sm" fw={600} mb="xs">
              Forms ({accessibleForms.length})
            </Text>
            <ScrollArea h={420} type="auto">
              <Stack gap="xs">
                {accessibleForms.map((form) => (
                  <Group
                    key={form.id}
                    gap="sm"
                    p="xs"
                    wrap="nowrap"
                    style={{
                      borderRadius: 8,
                      cursor: 'pointer',
                      background:
                        form.id === selectedFormId
                          ? 'var(--mantine-color-blue-0)'
                          : undefined,
                      border:
                        form.id === selectedFormId
                          ? '1px solid var(--mantine-color-blue-4)'
                          : '1px solid var(--mantine-color-default-border)',
                    }}
                    onClick={() => setSelectedFormId(form.id)}
                  >
                    <FileText size={16} style={{ flexShrink: 0 }} />
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {form.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {formatEnum(form.category)} · v{form.version}
                      </Text>
                    </Stack>
                    {form.isPublished && (
                      <Badge size="xs" variant="light" color="teal">
                        Published
                      </Badge>
                    )}
                  </Group>
                ))}
              </Stack>
            </ScrollArea>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            {!selectedForm ? (
              <Text size="sm" c="dimmed">
                Select a form to begin documenting.
              </Text>
            ) : (
              <Stack gap="md">
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={2}>
                    <Text fw={600}>{selectedForm.name}</Text>
                    <Text size="xs" c="dimmed">
                      {selectedForm.description ?? formatEnum(selectedForm.category)}
                    </Text>
                  </Stack>
                  {activeEncounter && (
                    <Badge variant="light" color="blue">
                      Encounter {activeEncounter.encounterNumber}
                    </Badge>
                  )}
                </Group>

                <PatientPicker
                  value={patient}
                  onChange={(next) => {
                    setPatient(next);
                    if (next) {
                      setPatientError(null);
                    }
                  }}
                  required
                  error={patientError}
                />

                <DynamicFormFields
                  schema={selectedForm.schemaJson}
                  value={data}
                  onChange={setData}
                />

                <Group justify="flex-end">
                  <Button
                    variant="light"
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate({ status: 'DRAFT' })}
                  >
                    Save Draft
                  </Button>
                  <Button
                    loading={mutation.isPending}
                    onClick={() => mutation.mutate({ status: 'SUBMITTED' })}
                  >
                    Submit Documentation
                  </Button>
                </Group>
              </Stack>
            )}
          </Grid.Col>
        </Grid>
      )}
    </Modal>
  );
}
