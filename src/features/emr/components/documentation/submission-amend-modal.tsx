import { Badge, Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { emrApi } from '@/lib/emr-api';
import { useFormDefinition } from '../../hooks/use-form-definition';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { FormSubmission } from '../../lib/emr-types';
import { StatusBadge } from '../shared/status-badge';
import {
  DynamicFormFields,
  validateFormData,
  type FormData,
} from './dynamic-form';

export function SubmissionAmendModal({
  opened,
  onClose,
  onSaved,
  submission,
}: {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
  submission: FormSubmission | null;
}) {
  const queryClient = useQueryClient();
  const { data: form, isLoading } = useFormDefinition(submission?.formDefinitionId);
  const [data, setData] = useState<FormData>({});

  // Pre-fill from the submission's existing data each time the modal opens.
  useEffect(() => {
    if (opened && submission) {
      setData({ ...(submission.dataJson ?? {}) });
    }
  }, [opened, submission]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form) {
        throw new Error('Form definition is required');
      }
      const errors = validateFormData(form.schemaJson, data);
      if (errors.length > 0) {
        throw new Error(`Please fix the form: ${errors.join('; ')}`);
      }
      const { data: res } = await emrApi.post(`/form-submissions/${submission?.id}/amend`, {
        dataJson: data,
      });
      return res;
    },
    onSuccess: () => {
      notifications.show({ message: 'Documentation amended', color: 'teal' });
      queryClient.invalidateQueries({ queryKey: ['emr', 'form-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['emr', 'patients'] });
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Amend Documentation" size="lg" centered>
      {!submission ? null : isLoading || !form ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack gap="md">
            <Group gap="xs" wrap="wrap">
              <Badge variant="light">{submission.submissionNumber}</Badge>
              <Text size="sm" fw={600}>
                {submission.formName}
              </Text>
              <Badge variant="light">v{submission.formVersion}</Badge>
              <StatusBadge value={submission.status} kind="submission" />
            </Group>

            <Text size="xs" c="dimmed">
              Amending creates a new submission version while preserving this one.
            </Text>

            <DynamicFormFields schema={form.schemaJson} value={data} onChange={setData} />

            <Group justify="flex-end">
              <Button variant="light" onClick={onClose} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
                Save Amendment
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
