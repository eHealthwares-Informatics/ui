import { Text } from '@mantine/core';
import { useFormDefinition } from '../../hooks/use-form-definition';
import type { FormFieldSchema, FormSubmission } from '../../lib/emr-types';
import { formatAnnotateValue } from '../forms/annotate/format-annotate';

const MAX_FIELDS = 3;
const MAX_CHARS = 60;

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

function summarizeValue(value: unknown): string {
  if (value !== null && typeof value === 'object') {
    const record = value as { label?: unknown; code?: unknown; kind?: unknown };
    if (typeof record.label === 'string') {
      const caption =
        record.label + (typeof record.code === 'string' && record.code ? ` (${record.code})` : '');
      return typeof record.kind === 'string'
        ? `${caption} · ${record.kind.replace(/_/g, ' ')}`
        : caption;
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return value.length > MAX_CHARS ? `${value.slice(0, MAX_CHARS)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) =>
      typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)
    );
    const joined = parts.join(', ');
    return joined.length > MAX_CHARS ? `${joined.slice(0, MAX_CHARS)}…` : joined;
  }
  if (value === null || value === undefined) {
    return '—';
  }
  return JSON.stringify(value);
}

/** Compact inline summary of a submission's first non-empty fields. */
export function SubmissionSummary({ submission }: { submission: FormSubmission }) {
  const { data: form } = useFormDefinition(submission.formDefinitionId);

  const entries = Object.entries(submission.dataJson ?? {}).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
  );

  if (entries.length === 0) {
    return null;
  }

  const shown = entries.slice(0, MAX_FIELDS);

  return (
    <Text size="xs" c="dimmed" lineClamp={2}>
      {shown.map(([key, value], index) => {
        const field = findField(form?.schemaJson?.fields, key);
        return (
          <span key={key}>
            {index > 0 && ' · '}
            <Text component="span" fw={600} c="gray.8">
              {field?.label ?? key}:
            </Text>{' '}
            {field?.type === 'annotate'
              ? formatAnnotateValue(value, field.annotate)
              : summarizeValue(value)}
          </span>
        );
      })}
    </Text>
  );
}
