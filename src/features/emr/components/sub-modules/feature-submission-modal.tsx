import { Alert, Badge, Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { Feature, FeatureSession } from '../../lib/emr-types';
import {
  DynamicFormFields,
  buildInitialFormData,
  validateFormData,
  type FormData,
} from '../documentation/dynamic-form';
import { EncounterTimer } from '../encounters/encounter-timer';
import { PatientPicker, type PatientOption } from '../shared/patient-picker';

/**
 * Captures one feature-form submission.
 *
 * Selecting a patient starts a same-day session on the backend (appointment +
 * visit/admission + encounter). Saving the record closes the encounter;
 * closing the modal without saving cancels it.
 */
export function FeatureSubmissionModal({
  opened,
  onClose,
  feature,
  onSubmitted,
}: {
  opened: boolean;
  onClose: () => void;
  feature: Feature;
  onSubmitted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [session, setSession] = useState<FeatureSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [data, setData] = useState<FormData>({});
  const [formError, setFormError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const form = feature.form;

  useEffect(() => {
    if (!opened) {
      return;
    }
    submittedRef.current = false;
    setPatient(null);
    setSession(null);
    setSessionError(null);
    setPatientError(null);
    setFormError(null);
    setData(form ? buildInitialFormData(form.schemaJson) : {});
  }, [opened, form]);

  const startSession = useMutation({
    mutationFn: async (patientId: string) => {
      const { data: result } = await emrApi.post<FeatureSession>(
        `/features/${feature.id}/sessions`,
        { patientId }
      );
      return result;
    },
    onSuccess: (result) => {
      setSession(result);
      setSessionError(null);
      setPatientError(null);
      if (form) {
        setData(buildInitialFormData(form.schemaJson));
      }
    },
    onError: (error) => {
      setSession(null);
      setSessionError(getApiErrorMessage(error));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (encounterId: string) => {
      await emrApi.patch(`/encounters/${encounterId}`, {
        status: 'CANCELLED',
        endedAt: new Date().toISOString(),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['emr', 'encounters'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'SUBMITTED') => {
      if (!form) {
        throw new Error('Form definition is missing');
      }
      if (!patient) {
        setPatientError('Select a patient');
        throw new Error('Patient is required');
      }
      if (!session?.encounter?.id) {
        throw new Error('Start a session first');
      }
      if (status === 'SUBMITTED') {
        const errors = validateFormData(form.schemaJson, data);
        if (errors.length > 0) {
          throw new Error(`Please fix the form: ${errors.join('; ')}`);
        }
      }
      const { data: result } = await emrApi.post('/form-submissions', {
        formDefinitionId: feature.formDefinitionId,
        patientId: patient.patientId,
        encounterId: session.encounter.id,
        dataJson: data,
        status,
        closeEncounter: true,
      });
      return result;
    },
    onSuccess: () => {
      submittedRef.current = true;
      notifications.show({
        message: 'Record saved — encounter closed',
        color: 'teal',
      });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'form-submissions'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'encounters'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'visits'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'appointments'] });
      onSubmitted?.();
      onClose();
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const handlePatientChange = (next: PatientOption | null) => {
    if (!next) {
      return;
    }
    const previousEncounterId = session?.encounter?.id;
    if (previousEncounterId && !submittedRef.current) {
      cancelMutation.mutate(previousEncounterId);
    }
    setPatient(next);
    setSession(null);
    setSessionError(null);
    setPatientError(null);
    setFormError(null);
    startSession.mutate(next.patientId);
  };

  const handleClose = () => {
    if (session?.encounter?.id && !submittedRef.current) {
      cancelMutation.mutate(session.encounter.id);
    }
    onClose();
  };

  const isBusy = startSession.isPending || saveMutation.isPending;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`New Record — ${form?.name ?? 'Feature'}`}
      size="xl"
      centered
    >
      {!form ? (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          This feature has no form definition.
        </Alert>
      ) : (
        <Stack gap="md">
          <PatientPicker
            value={patient}
            onChange={handlePatientChange}
            required
            disabled={saveMutation.isPending}
            error={patientError}
          />

          {startSession.isPending && (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">
                Preparing same-day appointment, visit and encounter…
              </Text>
            </Group>
          )}

          {sessionError && (
            <Alert color="red" icon={<AlertCircle size={16} />}>
              {sessionError}
            </Alert>
          )}

          {session && (
            <Alert color="blue" variant="light" title="Session active">
              <Group gap="lg" wrap="wrap">
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Encounter
                  </Text>
                  <Group gap="xs">
                    <Badge variant="light">{session.encounter.encounterNumber}</Badge>
                    <EncounterTimer
                      startIso={session.encounter.encounterDatetime}
                      fallbackIso={session.encounter.createdAt}
                      size="sm"
                    />
                  </Group>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Visit
                  </Text>
                  <Text size="sm">{session.visit.visitNumber}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Appointment
                  </Text>
                  <Text size="sm">{session.appointment?.appointmentNumber ?? '—'}</Text>
                </Stack>
                {session.admission && (
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Admission
                    </Text>
                    <Text size="sm">{session.admission.admissionNumber}</Text>
                  </Stack>
                )}
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                The encounter closes automatically when the record is saved.
              </Text>
            </Alert>
          )}

          {formError && (
            <Alert color="red" icon={<AlertCircle size={16} />}>
              {formError}
            </Alert>
          )}

          <div style={{ opacity: session ? 1 : 0.55, pointerEvents: session ? 'auto' : 'none' }}>
            <DynamicFormFields schema={form.schemaJson} value={data} onChange={setData} />
          </div>

          <Group justify="flex-end">
            <Button
              variant="light"
              loading={saveMutation.isPending}
              disabled={isBusy || !session}
              onClick={() => saveMutation.mutate('DRAFT')}
              data-testid="feature-save-draft-button"
            >
              Save Draft
            </Button>
            <Button
              loading={saveMutation.isPending}
              disabled={isBusy || !session}
              onClick={() => saveMutation.mutate('SUBMITTED')}
              data-testid="feature-submit-button"
            >
              Submit Record
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
