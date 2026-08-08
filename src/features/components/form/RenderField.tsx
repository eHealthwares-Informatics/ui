import { ActionIcon, Badge, Grid, Group, SimpleGrid, Switch } from '@mantine/core';
import { memo, useCallback } from 'react';
import { LabelField } from '@/features/communication/components/shared';
import { ImageUploader } from '@/features/rxsoft/pages/products/components/image-uploader';
import { Field, Option } from '@/features/rxsoft/types';
import { AccordionArrayField, AccordionSingleField } from './accordion-fields';
import { AsyncSelectField } from './async-field';
import { DebouncedTextInput } from './debounced-text-input';
import { useFormField } from './form-context';
import { JsonEditorField } from './json-editor-field';
import { RemoteSelectField } from './remote-select-field';
import { SelectField } from './select';
import { FieldValue } from './types/form-context';

type Props = {
  field: Field;
  // Legacy props (for backward compatibility)
  value: FieldValue;
  updateField?: (key: string, value: any) => void;
  // New callback-based API
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  error?: string;
  // If true, use FormProvider instead of props
  useFormContext?: boolean;
  inTable?: boolean;
};

function RenderFieldComponent({
  field,
  value: propValue,
  updateField,
  onChange,
  onBlur,
  onFocus,
  disabled,
  error: propError,
  useFormContext = true,
  inTable = false,
}: Props) {
  // Use FormProvider hook if available, fall back to props
  let fieldValue = propValue;
  let fieldError = propError;
  let formState: Record<string, unknown> | undefined;

  let handleChange = useCallback(
    (v: any) => {
      onChange?.(v);
      updateField?.(field.name, v);
    },
    [onChange, updateField, field.name]
  );

  if (useFormContext) {
    try {
      const fieldState = useFormField(field.name);
      fieldValue = fieldState.value;
      fieldError = fieldState.error;
      formState = fieldState.formState as Record<string, unknown>;
      handleChange = useCallback(
        (v: any) => {
          fieldState.setValue(v);
          onChange?.(v);
        },
        [fieldState, onChange]
      );
    } catch (err) {
      // FormProvider not available, use props
      // console.debug('FormProvider not available, using prop-based mode');
    }
  }

  if (field.type === 'switch') {
    return (
      <LabelField label={field.label} required>
        <Switch
          checked={Boolean(fieldValue)}
          disabled={disabled}
          onChange={(event) => {
            handleChange(Boolean(event.currentTarget.checked));
          }}
          onBlur={onBlur}
          onFocus={onFocus}
          error={fieldError}
        />
      </LabelField>
    );
  }

  if (field.type === 'async-select') {
    return (
      <LabelField label={field.label} required>
        <AsyncSelectField
          field={field}
          value={fieldValue as Option}
          disabled={disabled}
          onChange={(option: Option | null) => {
            handleChange(option);
          }}
          onBlur={onBlur}
          onFocus={onFocus}
          error={fieldError}
          formState={formState}
        />
      </LabelField>
    );
  }

  if (field.type === 'multi-async-select') {
    const raw = (fieldValue || []) as (string | Option)[];
    const current: Option[] = field.toOptions
      ? field.toOptions(raw)
      : raw.map((item) => (typeof item === 'string' ? { value: item, label: item } : item));
    const toggle = (option: Option) => {
      const index = current.findIndex((item) => item.value === option.value);
      const updated = index >= 0 ? current.filter((_, i) => i !== index) : [...current, option];
      handleChange(updated);
    };
    return (
      <LabelField label={field.label} required>
        <AsyncSelectField
          field={field}
          value={'' as any}
          disabled={disabled}
          onChange={(option) => option && toggle(option)}
          onBlur={onBlur}
          onFocus={onFocus}
          error={fieldError}
          clearAfterSelect
          selectedValues={current.map((item) => (item as Option).value)}
        />
        <Group gap="xs">
          {current.map((item: string | Option) => (
            <Badge
              key={item.toString()}
              rightSection={
                <ActionIcon
                  size="xs"
                  color="gray"
                  radius="xl"
                  variant="transparent"
                  onClick={() => toggle(item as Option)}
                >
                  ×
                </ActionIcon>
              }
            >
              {(item as Option).label}
            </Badge>
          ))}
        </Group>
      </LabelField>
    );
  }

  if (field.type === 'select') {
    return (
      <LabelField label={field.label} required={field.required}>
        <SelectField
          value={
            typeof fieldValue === 'string'
              ? { label: fieldValue, value: fieldValue }
              : (fieldValue as any)
          }
          disabled={disabled}
          onChange={(v) => {
            handleChange(v);
          }}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={field.placeholder}
          options={field.options ?? []}
          error={fieldError}
        />
      </LabelField>
    );
  }

  if (field.type === 'remote-select') {
    return (
      <LabelField label={field.label} required={field.required}>
        <RemoteSelectField
          value={String(fieldValue)}
          field={field}
          onChange={(v) => handleChange(v)}
          onBlur={onBlur}
          onFocus={onFocus}
          error={fieldError}
        />
      </LabelField>
    );
  }

  if (field.type === 'multi-pick') {
    const current = (fieldValue as Option[]) || [];
    const toggle = (option: Option) => {
      const index = current.findIndex((item) => item.value === option.value);
      const updated = index >= 0 ? current.filter((_, i) => i !== index) : [...current, option];
      handleChange(updated);
    };
    return (
      <>
        <SelectField
          value={fieldValue as Option}
          disabled={disabled}
          onChange={(option) => option && toggle(option)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={field.placeholder}
          options={field.options ?? []}
          error={fieldError}
        />
        <Group gap="xs">
          {(current || []).map((item: Option) => (
            <Badge
              key={item.value}
              rightSection={
                <ActionIcon
                  size="xs"
                  color="gray"
                  radius="xl"
                  variant="transparent"
                  onClick={() => toggle(item)}
                >
                  ×
                </ActionIcon>
              }
            >
              {item.label}
            </Badge>
          ))}
        </Group>
      </>
    );
  }
  fieldValue as Option[];

  // if (field.type === "multi-select") {
  //   const current = (fieldValue || [])
  // disabled = { disabled }
  // onChange = {(v: any) => handleChange(v)}
  // onBlur = { onBlur }
  // onFocus = { onFocus }
  // placeholder = { field.placeholder ?? `Select ${field.label.toLowerCase()}` }
  // options = { field.options ?? [] }
  // error = { fieldError }
  //   />
  //       </>
  //     )
  //   }

  if (field.type === 'json') {
    return (
      <JsonEditorField error={fieldError} value={fieldValue} onChange={(v) => handleChange(v)} />
    );
  }

  if (field.type === 'textarea') {
    return (
      <LabelField label={inTable ? '' : field.label} required={field.required}>
        <DebouncedTextInput
          isTextarea
          value={(fieldValue as string) ?? ''}
          onChange={(v) => handleChange(v)}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={field.placeholder}
          autosize
          minRows={3}
          error={fieldError}
        />
      </LabelField>
    );
  }

  if (field.type === 'image') {
    return (
      <Grid.Col span={{ base: 12, md: field.col ?? 6 }}>
        <ImageUploader
          label={field.label}
          description={field.placeholder}
          value={(fieldValue as string) ?? ''}
          onChange={(url) => handleChange(url)}
          size={(field as any).imageSize ?? 'medium'}
        />
      </Grid.Col>
    );
  }

  if (field.type === 'multi-image') {
    return null;
  }

  if (field.type === 'hidden') {
    // For hidden fields, still set value but don't render
    if (propValue !== undefined && updateField) {
      updateField(field.name, fieldValue);
    }
    return null;
  }

  if (field.type === 'accordion-array') {
    const items: any[] = (fieldValue as any[]) || [];
    return <AccordionArrayField field={field} items={items} parentFormState={formState} />;
  }

  if (field.type === 'accordion') {
    return (
      <AccordionSingleField
        field={field}
        value={fieldValue as string | null | undefined}
        onChange={(v) => handleChange(v)}
      />
    );
  }

  return (
    <LabelField label={inTable ? '' : field.label} required={!inTable && field.required}>
      <DebouncedTextInput
        value={(fieldValue as string) ?? ''}
        readOnly={disabled}
        onChange={(v) => handleChange(v)}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={field.placeholder}
        type={field.type}
        error={fieldError}
        disabled={disabled}
        size={inTable ? 'xs' : undefined}
        styles={
          inTable
            ? {
                input: {
                  borderBottom: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: 0, // Optional: neat flat underline look
                },
              }
            : undefined
        }
        w={inTable ? 100 : undefined}
      />
    </LabelField>
  );
}

export const RenderField = memo(RenderFieldComponent);
