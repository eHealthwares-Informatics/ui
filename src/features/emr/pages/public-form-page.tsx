import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { emrPublicApi } from '@/lib/emr-public-api';
import {
  DynamicFormFields,
  buildInitialFormData,
  validateFormData,
  type FormData,
} from '../components/documentation/dynamic-form';
import type { FormFieldSchema, FormRuntimeContext, PublicFormPayload } from '../lib/emr-types';

function flatten(fields: FormFieldSchema[] | undefined): FormFieldSchema[] {
  const out: FormFieldSchema[] = [];
  const walk = (list: FormFieldSchema[] | undefined) => {
    for (const field of list ?? []) {
      out.push(field);
      if (field.fields?.length) {
        walk(field.fields);
      }
    }
  };
  walk(fields);
  return out;
}

/** Public, unauthenticated form fill page. */
export function PublicFormPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const [data, setData] = useState<FormData>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const query = useQuery({
    queryKey: ['emr', 'public-form', token],
    queryFn: async () => {
      const { data } = await emrPublicApi.get<PublicFormPayload>(`/public/forms/${token}`);
      return data;
    },
    enabled: Boolean(token),
    retry: false,
  });

  const payload = query.data;
  const runtime: FormRuntimeContext = {
    publicToken: token,
    formDefinitionId: payload?.form.id,
    formEventKey: payload?.form.eventKey ?? null,
    submissionId: payload?.submission?.id ?? null,
    hideActions: true,
    patient: payload?.patient
      ? {
          patientId: payload.patient.patientId,
          patientName: payload.patient.name,
        }
      : null,
  };

  useEffect(() => {
    if (!payload) {
      return;
    }
    setData(payload.submission?.dataJson ?? buildInitialFormData(payload.form.schemaJson, runtime));
    setSaved(false);
    setError(null);
  }, [payload?.form.id, payload?.submission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useMutation({
    mutationFn: async () => {
      if (!payload) {
        throw new Error('Form not loaded');
      }
      const errors = validateFormData(payload.form.schemaJson, data);
      if (errors.length > 0) {
        throw new Error(errors.join('; '));
      }
      const authField = flatten(payload.form.schemaJson.fields).find(
        (field) => field.type === 'auth-patient'
      );
      const proof = authField
        ? (data[authField.key] as { proof?: string } | undefined)?.proof
        : undefined;
      const { data: result } = await emrPublicApi.post(`/public/forms/${token}/submissions`, {
        dataJson: data,
        patientProof: proof,
      });
      return result;
    },
    onSuccess: () => {
      setSaved(true);
      setError(null);
      void query.refetch();
    },
    onError: (err) => {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err as Error).message ??
          'Could not submit the form'
      );
    },
  });

  if (query.isLoading) {
    return (
      <Container size="sm" py="xl">
        <Group justify="center">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (query.isError || !payload) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" icon={<AlertCircle size={16} />}>
          This form link is invalid, expired or no longer accepting responses.
        </Alert>
      </Container>
    );
  }

  const editingExisting = Boolean(payload.submission);
  const submitted = payload.submission?.status !== 'DRAFT';

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap={4}>
          <Group gap="xs">
            <Badge variant="light">{payload.form.code}</Badge>
            {payload.patient && (
              <Badge variant="light" color="teal">
                {payload.patient.name}
              </Badge>
            )}
            {editingExisting && (
              <Badge variant="light" color="blue">
                {submitted ? 'Editing submitted form' : 'Draft'}
              </Badge>
            )}
          </Group>
          <Title order={2}>{payload.form.name}</Title>
          {payload.form.description && (
            <Text size="sm" c="dimmed">
              {payload.form.description}
            </Text>
          )}
        </Stack>

        {saved && (
          <Alert color="teal" icon={<CheckCircle2 size={16} />}>
            Thank you — your form has been saved.
            {submitted ? ' Your changes were recorded as an amendment.' : ''}
          </Alert>
        )}
        {error && (
          <Alert color="red" icon={<AlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <DynamicFormFields
              schema={payload.form.schemaJson}
              value={data}
              onChange={setData}
              runtime={runtime}
            />
            <Group justify="flex-end">
              <Button
                loading={submit.isPending}
                onClick={() => submit.mutate()}
                data-testid="public-form-submit-button"
              >
                {submitted ? 'Save Amendment' : 'Submit'}
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
