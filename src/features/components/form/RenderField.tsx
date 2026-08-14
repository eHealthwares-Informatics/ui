import { ActionIcon, Badge, Grid, Group, SimpleGrid, Switch, UnstyledButton } from '@mantine/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useApiProvider } from '@/context/module-context';
import { LabelField } from '@/features/communication/components/shared';
import { ImageUploader } from '@/features/rxsoft/pages/products/components/image-uploader';
import { Field, Option } from '@/features/rxsoft/types';
import { AccordionArrayField, AccordionSingleField, JsonAccordionArrayField } from './accordion-fields';
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
  /** Parent form state passed down for nested/accordion fields (used when no FormProvider) */
  parentFormState?: Record<string, unknown>;
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
  parentFormState,
  useFormContext = true,
  inTable = false,
}: Props) {
  // Use FormProvider hook if available, fall back to props
  let fieldValue = propValue;
  let fieldError = propError;
  let formState: Record<string, unknown> | undefined = parentFormState;

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
      <JsonEditorField
        label={field.label}
        placeholder={field.placeholder}
        error={fieldError}
        value={fieldValue}
        onChange={(v) => handleChange(v)}
      />
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
    return <HiddenFieldSync field={field} value={fieldValue} onSync={handleChange} />;
  }

  if (field.type === 'accordion-array') {
    const items: any[] = (fieldValue as any[]) || [];
    return (
      <AccordionArrayField
        field={field}
        items={items}
        parentFormState={formState}
        onChange={handleChange}
      />
    );
  }

  if (field.type === 'json-accordion-array') {
    const items: any[] = (fieldValue as any[]) || [];
    return <JsonAccordionArrayField field={field} items={items} onChange={handleChange} />;
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
      <Group align="flex-end" gap={4} wrap="nowrap">
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
          style={{ flex: 1 }}
          w={inTable ? 100 : undefined}
        />
        {field.generateCode && !inTable ? (
          <GenerateCodeLink
            field={field}
            formState={formState}
            onGenerated={handleChange}
            disabled={disabled}
          />
        ) : null}
      </Group>
    </LabelField>
  );
}

export const RenderField = memo(RenderFieldComponent);

function HiddenFieldSync({
  field,
  value,
  onSync,
}: {
  field: Field;
  value: FieldValue;
  onSync: (value: FieldValue) => void;
}) {
  const valueRef = useRef(value);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (value !== undefined && value !== valueRef.current) {
      valueRef.current = value;
      onSyncRef.current(value);
    }
  }, [value]);

  return null;
}

function GenerateCodeLink({
  field,
  formState,
  onGenerated,
  disabled,
}: {
  field: Field;
  formState: Record<string, unknown> | undefined;
  onGenerated: (value: string) => void;
  disabled?: boolean;
}) {
  const apiProvider = useApiProvider();
  const [loading, setLoading] = useState(false);
  const config = field.generateCode!;
  const seedField = config.seedField ?? 'name';

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const seed = String(formState?.[seedField] ?? '');
      const response = await apiProvider.get('/lis/code-generator/generate', {
        params: {
          scope: config.scope,
          seed,
          mode: config.mode,
          prefix: config.prefix,
          maxLength: config.maxLength,
        },
      });
      onGenerated(response.data?.code ?? '');
    } catch (err) {
      // Let the field stay untouched on failure; the backend logs the error
      console.error('Failed to generate code', err);
    } finally {
      setLoading(false);
    }
  }, [apiProvider, config, formState, onGenerated, seedField]);

  return (
    <UnstyledButton
      component="button"
      type="button"
      size="xs"
      onClick={handleClick}
      disabled={disabled}
      className="text-[9px] font-medium leading-none text-blue-600 underline disabled:cursor-not-allowed disabled:text-gray-400"
    >
      {loading ? '…' : 'Generate'}
    </UnstyledButton>
  );
}