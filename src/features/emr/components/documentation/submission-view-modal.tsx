import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { emrApi } from '@/lib/emr-api';
import { useFormDefinition } from '../../hooks/use-form-definition';
import { usePatientByMrn } from '../../hooks/use-patient-by-mrn';
import type { FormFieldSchema, FormSubmission } from '../../lib/emr-types';
import { printSubmission } from '../../lib/print-submission';
import { formatAnnotateValue } from '../forms/annotate/format-annotate';
import { FormQrCode } from '../shared/form-qr-code';
import { PrintSendActions } from '../shared/print-send-actions';
import { SendFormCard } from '../shared/send-form-card';
import { StatusBadge } from '../shared/status-badge';
import { SchemaOutdatedBadge } from './schema-outdated-badge';

function findField(fields: FormFieldSchema[] | undefined, key: string): FormFieldSchema | null {
  for (const field of fields ?? []) {
    if (field.key === key) {
      return field;
    }
    if ((field.type === 'tab' || field.type === 'col') && field.fields) {
      const nested = findField(field.fields, key);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function flattenFields(fields: FormFieldSchema[] | undefined): FormFieldSchema[] {
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

function renderFileValue(value: unknown) {
  const entries = (Array.isArray(value) ? value : [value]).filter(
    (entry): entry is { url: string; name?: string } =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as { url?: unknown }).url === 'string'
  );
  if (!entries.length) {
    return <Text size="sm">—</Text>;
  }
  return (
    <Stack gap={2}>
      {entries.map((entry) => (
        <Anchor
          key={entry.url}
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
        >
          {entry.name ?? entry.url}
        </Anchor>
      ))}
    </Stack>
  );
}

function renderPractitionerValue(value: unknown) {
  if (!value || typeof value !== 'object') {
    return <Text size="sm">—</Text>;
  }
  const staff = value as { staffName?: string; staffId?: string };
  if (!staff.staffName && !staff.staffId) {
    return <Text size="sm">—</Text>;
  }
  return (
    <Text size="sm">
      {[staff.staffName, staff.staffId ? `(${staff.staffId})` : null].filter(Boolean).join(' ')}
    </Text>
  );
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }
  if (typeof value === 'object') {
    const record = value as { label?: unknown; code?: unknown; kind?: unknown };
    if (typeof record.label === 'string') {
      const caption =
        record.label + (typeof record.code === 'string' && record.code ? ` (${record.code})` : '');
      return typeof record.kind === 'string'
        ? `${caption} · ${String(record.kind).replace(/_/g, ' ')}`
        : caption;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function SubmissionViewModal({
  opened,
  onClose,
  submission,
  onJump,
}: {
  opened: boolean;
  onClose: () => void;
  submission: FormSubmission | null;
  /** Navigate to another version in the amend chain (parent swaps the viewed submission). */
  onJump?: (submission: FormSubmission) => void;
}) {
  const { data: form, isLoading } = useFormDefinition(submission?.formDefinitionId);
  const { data: patient } = usePatientByMrn(submission?.patientId ?? undefined);
  const printField = flattenFields(form?.schemaJson?.fields).find(
    (field) => field.type === 'print'
  );
  const qrField = flattenFields(form?.schemaJson?.fields).find((field) => field.type === 'qr-code');
  const sendField = flattenFields(form?.schemaJson?.fields).find(
    (field) => field.type === 'send-form'
  );

  const chainQuery = useQuery({
    queryKey: ['emr', 'form-submissions', submission?.id, 'chain'],
    queryFn: async () => {
      const { data: res } = await emrApi.get<{ data: FormSubmission[] }>(
        `/form-submissions/${submission!.id}/chain`
      );
      return res.data;
    },
    enabled: opened && Boolean(submission),
    retry: false,
  });

  const chain = chainQuery.data ?? [];
  const chainIndex = chain.findIndex((entry) => entry.id === submission?.id);

  return (
    <Modal opened={opened} onClose={onClose} title="View Documentation" size="lg" centered>
      {!submission ? null : isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : (
        <Stack gap="md">
          <Group gap="xs" wrap="wrap">
            <Badge variant="light">{submission.submissionNumber}</Badge>
            <Text size="sm" fw={600}>
              {submission.formName}
            </Text>
            <Badge variant="light">v{submission.formVersion}</Badge>
            <SchemaOutdatedBadge submission={submission} />
            <StatusBadge value={submission.status} kind="submission" />
          </Group>

          {chain.length > 1 && (
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Amendments
                </Text>
                <Text size="xs" c="dimmed">
                  Version {chainIndex + 1} of {chain.length} · {chain.length - 1} amendment
                  {chain.length - 1 === 1 ? '' : 's'}
                </Text>
              </Group>
              <Group gap={6} wrap="wrap">
                {chain.map((entry, index) => {
                  const isCurrent = entry.id === submission.id;
                  return (
                    <Button
                      key={entry.id}
                      size="compact-xs"
                      variant={isCurrent ? 'filled' : 'light'}
                      disabled={isCurrent}
                      onClick={() => onJump?.(entry)}
                    >
                      {index === 0 ? 'Original' : `Amend ${index}`}
                    </Button>
                  );
                })}
              </Group>
            </Stack>
          )}

          <Text size="xs" c="dimmed">
            Submitted by {submission.submittedByName ?? 'Unknown'} ·{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : '—'}
          </Text>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Object.entries(submission.dataJson ?? {}).map(([key, value]) => {
              const field = findField(form?.schemaJson?.fields, key);
              if (
                field &&
                (field.type === 'hidden' ||
                  field.type === 'html' ||
                  field.type === 'print' ||
                  field.type === 'send-form' ||
                  field.type === 'qr-code')
              ) {
                return null;
              }
              const label = field?.label ?? key;
              return (
                <Stack key={key} gap={2}>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {label}
                  </Text>
                  <Text size="sm">
                    {field?.type === 'file'
                      ? renderFileValue(value)
                      : field?.type === 'practitioner'
                        ? renderPractitionerValue(value)
                        : field?.type === 'annotate'
                          ? formatAnnotateValue(value, field.annotate)
                          : renderValue(value)}
                  </Text>
                </Stack>
              );
            })}
          </SimpleGrid>

          {qrField && (
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Scan to reopen this form
              </Text>
              <FormQrCode
                formDefinitionId={submission.formDefinitionId}
                submissionId={submission.id}
                patientId={submission.patientId ?? undefined}
                mode={qrField.qrMode ?? 'auto'}
                size={qrField.qrSize ?? 180}
                caption={qrField.caption}
              />
            </Stack>
          )}

          {sendField && (
            <SendFormCard
              formDefinitionId={submission.formDefinitionId}
              submissionId={submission.id}
              patientId={submission.patientId ?? undefined}
              phone={patient?.phone}
              email={patient?.email}
              label={sendField.label}
              channels={sendField.channels}
            />
          )}

          <Group justify="flex-end" mt="md">
            {printField ? (
              <PrintSendActions
                submissionId={submission.id}
                printFormat={printField.printFormat ?? 'a4_print'}
                phone={patient?.phone}
                email={patient?.email}
              />
            ) : (
              <Button
                variant="light"
                leftSection={<Printer size={14} />}
                onClick={() => {
                  void printSubmission(submission).then((ok) => {
                    if (!ok) {
                      notifications.show({
                        color: 'red',
                        message:
                          'Could not generate the PDF — check your connection and try again.',
                      });
                    }
                  });
                }}
              >
                Print / PDF
              </Button>
            )}
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
