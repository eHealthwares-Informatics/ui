import {
  ActionIcon,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Group,
  NumberInput,
  Radio,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import type { FormFieldSchema, FormSchema } from '../../lib/emr-types';
import { formatEnum } from '../../lib/emr-constants';

export type FormData = Record<string, unknown>;

function optionsFor(field: FormFieldSchema) {
  return (field.options ?? []).map((option) => ({ value: option, label: formatEnum(option) }));
}

function TableCell({
  column,
  value,
  onChange,
}: {
  column: NonNullable<FormFieldSchema['columns']>[number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (column.type) {
    case 'number':
      return (
        <NumberInput
          size="xs"
          value={typeof value === 'number' ? value : ''}
          onChange={(next) => onChange(next === '' ? undefined : Number(next))}
        />
      );
    case 'select':
      return (
        <Select
          size="xs"
          data={optionsFor({ key: column.key, label: column.label, type: 'select' })}
          clearable
          value={typeof value === 'string' ? value : null}
          onChange={(next) => onChange(next ?? undefined)}
        />
      );
    case 'checkbox':
      return <Checkbox checked={Boolean(value)} onChange={(e) => onChange(e.currentTarget.checked)} />;
    case 'textarea':
      return (
        <Textarea
          size="xs"
          autosize
          minRows={1}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
    default:
      return (
        <TextInput
          size="xs"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
  }
}

function TableField({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const columns = field.columns ?? [];
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

  const updateRow = (rowIndex: number, columnKey: string, cellValue: unknown) => {
    const next = rows.map((row, index) =>
      index === rowIndex ? { ...row, [columnKey]: cellValue } : row,
    );
    onChange(next);
  };

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {field.label}
        </Text>
        <Button size="compact-xs" variant="light" leftSection={<Plus size={13} />} onClick={() => onChange([...rows, {}])}>
          Add row
        </Button>
      </Group>
      {rows.length === 0 ? (
        <Text size="xs" c="dimmed">
          No rows yet.
        </Text>
      ) : (
        <Stack gap="xs">
          {rows.map((row, rowIndex) => (
            <Group key={rowIndex} gap="xs" align="flex-start">
              {columns.map((column) => (
                <div key={column.key} style={{ flex: 1, minWidth: 120 }}>
                  <Text size="xs" c="dimmed" mb={2}>
                    {column.label}
                  </Text>
                  <TableCell
                    column={column}
                    value={row[column.key]}
                    onChange={(cellValue) => updateRow(rowIndex, column.key, cellValue)}
                  />
                </div>
              ))}
              <ActionIcon
                variant="subtle"
                color="red"
                mt={20}
                onClick={() => onChange(rows.filter((_, index) => index !== rowIndex))}
                aria-label={`Remove row ${rowIndex + 1}`}
              >
                <Trash2 size={15} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const common = {
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...common}
          autosize
          minRows={field.rows ?? 2}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
    case 'number':
      return (
        <NumberInput
          {...common}
          value={typeof value === 'number' ? value : ''}
          onChange={(next) => onChange(next === '' ? undefined : Number(next))}
        />
      );
    case 'date':
      return (
        <TextInput
          {...common}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
    case 'datetime':
      return (
        <TextInput
          {...common}
          type="datetime-local"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
    case 'select':
      return (
        <Select
          {...common}
          data={optionsFor(field)}
          clearable
          value={typeof value === 'string' ? value : null}
          onChange={(next) => onChange(next ?? undefined)}
        />
      );
    case 'radio':
      return (
        <Radio.Group {...common} value={typeof value === 'string' ? value : ''} onChange={onChange}>
          <Stack gap="xs" mt={6}>
            {(field.options ?? []).map((option) => (
              <Radio key={option} value={option} label={formatEnum(option)} />
            ))}
          </Stack>
        </Radio.Group>
      );
    case 'checkbox':
      return (
        <Checkbox
          label={field.label}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.currentTarget.checked)}
        />
      );
    case 'checkbox-group':
      return (
        <CheckboxGroup
          label={field.label}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(next) => onChange(next.length > 0 ? next : undefined)}
        >
          <Stack gap="xs" mt={6}>
            {(field.options ?? []).map((option) => (
              <Checkbox key={option} value={option} label={formatEnum(option)} />
            ))}
          </Stack>
        </CheckboxGroup>
      );
    case 'table':
      return <TableField field={field} value={value} onChange={onChange} />;
    case 'section':
      return <Divider label={field.label} labelPosition="left" />;
    default:
      return (
        <TextInput
          {...common}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.currentTarget.value || undefined)}
        />
      );
  }
}

function FieldStack({
  fields,
  value,
  setField,
}: {
  fields: FormFieldSchema[];
  value: FormData;
  setField: (key: string, fieldValue: unknown) => void;
}) {
  return (
    <Stack gap="md">
      {fields.map((field) => {
        if (field.type === 'tab') {
          const children = field.fields ?? [];
          return (
            <Tabs key={field.key} defaultValue={children[0]?.key} keepMounted={false}>
              <Tabs.List mb="md">
                {children.map((child) => (
                  <Tabs.Tab key={child.key} value={child.key}>
                    {child.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
              {children.map((child) => (
                <Tabs.Panel key={child.key} value={child.key} pt="md">
                  <FieldStack fields={child.fields ?? []} value={value} setField={setField} />
                </Tabs.Panel>
              ))}
            </Tabs>
          );
        }
        if (field.type === 'col') {
          const children = field.fields ?? [];
          return (
            <SimpleGrid
              key={field.key}
              cols={{ base: 1, sm: Math.min(children.length || 1, 4) }}
              spacing="md"
            >
              {children.map((child) => (
                <div key={child.key}>
                  <DynamicField
                    field={child}
                    value={value[child.key]}
                    onChange={(childValue) => setField(child.key, childValue)}
                  />
                </div>
              ))}
            </SimpleGrid>
          );
        }
        return (
          <DynamicField
            key={field.key}
            field={field}
            value={value[field.key]}
            onChange={(fieldValue) => setField(field.key, fieldValue)}
          />
        );
      })}
    </Stack>
  );
}

export function DynamicFormFields({
  schema,
  value,
  onChange,
}: {
  schema: FormSchema;
  value: FormData;
  onChange: (value: FormData) => void;
}) {
  const setField = (key: string, fieldValue: unknown) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return <FieldStack fields={schema.fields} value={value} setField={setField} />;
}

/** Build initial form data from schema defaults (recursing into tabs). */
export function buildInitialFormData(schema: FormSchema): FormData {
  const data: FormData = {};
  const walk = (fields: FormFieldSchema[]): void => {
    for (const field of fields) {
      if (field.type === 'section') {
        continue;
      }
      if (field.type === 'tab' || field.type === 'col') {
        walk(field.fields ?? []);
        continue;
      }
      if (field.type === 'table') {
        data[field.key] = [];
        continue;
      }
      if (field.defaultValue !== undefined) {
        data[field.key] = field.defaultValue;
      }
    }
  };
  walk(schema.fields);
  return data;
}

/** Lightweight client-side validation mirroring the backend schema validator. */
export function validateFormData(
  schema: FormSchema,
  data: FormData,
): string[] {
  const errors: string[] = [];

  const validateField = (field: FormFieldSchema): void => {
    if (field.type === 'section') {
      return;
    }
    if (field.type === 'tab' || field.type === 'col') {
      for (const child of field.fields ?? []) {
        validateField(child);
      }
      return;
    }
    if (field.type === 'table') {
      return;
    }

    const fieldValue = data[field.key];
    if (field.required && (fieldValue === undefined || fieldValue === '' || fieldValue == null)) {
      errors.push(`${field.label} is required`);
      return;
    }
    if (fieldValue === undefined || fieldValue === '') {
      return;
    }
    if (field.type === 'number' && (typeof fieldValue !== 'number' || Number.isNaN(fieldValue))) {
      errors.push(`${field.label} must be a number`);
    }
    if (
      (field.type === 'date' || field.type === 'datetime') &&
      (typeof fieldValue !== 'string' || Number.isNaN(Date.parse(fieldValue)))
    ) {
      errors.push(`${field.label} must be a valid date`);
    }
    if (
      (field.type === 'select' || field.type === 'radio') &&
      field.options &&
      !field.options.includes(String(fieldValue))
    ) {
      errors.push(`${field.label} has an invalid option`);
    }
    if (
      field.type === 'checkbox-group' &&
      (!Array.isArray(fieldValue) || fieldValue.some((v) => !field.options?.includes(String(v))))
    ) {
      errors.push(`${field.label} must be a valid selection`);
    }
  };

  for (const field of schema.fields) {
    validateField(field);
  }
  return errors;
}
