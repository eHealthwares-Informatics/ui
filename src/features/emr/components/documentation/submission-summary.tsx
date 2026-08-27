import { Text } from '@mantine/core';
import { useFormDefinition } from '../../hooks/use-form-definition';
import type { FormFieldSchema, FormSubmission } from '../../lib/emr-types';

const MAX_FIELDS = 3;
const MAX_CHARS = 60;

function findLabel(fields: FormFieldSchema[] | undefined, key: string): string | null {
  for (const field of fields ?? []) {
    if (field.key === key) {
      return field.label;
    }
    if ((field.type === 'tab' || field.type === 'col') && field.fields) {
      const nested = findLabel(field.fields, key);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function summarizeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > MAX_CHARS ? `${value.slice(0, MAX_CHARS)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value.map((item) =>
      typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item),
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
      !(Array.isArray(value) && value.length === 0),
  );

  if (entries.length === 0) {
    return null;
  }

  const shown = entries.slice(0, MAX_FIELDS);

  return (
    <Text size="xs" c="dimmed" lineClamp={2}>
      {shown.map(([key, value], index) => (
        <span key={key}>
          {index > 0 && ' · '}
          <Text component="span" fw={600} c="gray.8">
            {findLabel(form?.schemaJson?.fields, key) ?? key}:
          </Text>{' '}
          {summarizeValue(value)}
        </span>
      ))}
    </Text>
  );
}
