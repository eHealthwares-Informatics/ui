import { Stack, Text, Grid, Group, ActionIcon, Button } from '@mantine/core';
import { Plus, Save } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useApiProvider } from '@/context/module-context';
import { Field, FieldGroup as FieldGroupProp } from '@/features/rxsoft/types';
import { DataTable } from '../table/table';
import { FieldGroupAdd } from './field-group-add';
import { RenderField } from './RenderField';

export type Props = {
  title?: string;
  endpoint?: {
    url: string;
    method: 'get' | 'post';
    query: { formKey: string; paramKey: string }[];
  };
  fieldGroup: FieldGroupProp;
  index: number;
  formState: Record<string, unknown>;
  updateField: (name: string, value: unknown, index?: number) => void;
  rows?: Record<string, unknown>[];
};

function FieldGroupComponent({ title, fieldGroup, formState, updateField, index }: Props) {
  if (fieldGroup.renderer === 'matrix') {
    return (
      <FieldGroupAdd
        title={title}
        fieldGroup={fieldGroup}
        formState={formState}
        updateField={updateField}
        index={index}
      />
    );
  }

  const { fields, formStateField, columns, mutationMode, endpoint } = fieldGroup;
  const apiProvider = useApiProvider();
  const [localRows, setLocalRows] = useState<Record<string, unknown>[]>([]);
  const defaultValues = useMemo(() => {
    const values = (formStateField ? formState?.[formStateField] : formState) ?? {};

    return fields.reduce(
      (acc, field) => {
        acc[field.name] =
          (values as Record<string, unknown>)?.[field.name] ?? field.defaultValue ?? null;

        return acc;
      },
      {} as Record<string, unknown>
    );
  }, [fields, formState, formStateField]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    defaultValues,
    mode: 'onChange',
  });

  // useEffect(() => {
  //   reset(defaultValues)
  // }, [defaultValues, reset])

  useEffect(() => {
    const params: Record<string, string> = {};
    endpoint?.query.forEach((query) => {
      params[query.paramKey] = formState[query.formKey] as string;
    });
    endpoint &&
      apiProvider
        .get(endpoint.url, {
          params,
        })
        .then((response) => {
          setLocalRows(response.data);
        });
  }, [endpoint]);

  const handleAddRow = (values: Record<string, unknown>) => {
    setLocalRows((prev) => [...prev, values]);

    reset(
      fields.reduce(
        (acc, field) => {
          acc[field.name] = field.defaultValue ?? null;
          return acc;
        },
        {} as Record<string, unknown>
      )
    );
  };

  const handleDelete = (_row: any, rowIndex: number) => {
    setLocalRows((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  const handleSave = () => {
    if (mutationMode === 'row' && formStateField) {
      updateField(formStateField, localRows, index);
    }
  };
  return (
    <Stack key={`${title ?? 'group'}-${index}`} gap="sm">
      {title && (
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            {title}
          </Text>
        </Group>
      )}

      <Grid gap="md">
        {fields.map((field: Field) => (
          <Grid.Col
            key={field.name}
            span={{
              base: 12,
              md: field.col ?? 12,
            }}
          >
            <Controller
              name={field.name}
              control={control}
              rules={{
                required: field.required ? `${field.label ?? field.name} is required` : false,
                minLength: field.min
                  ? {
                      value: field.min,
                      message: `Minimum ${field.min} characters`,
                    }
                  : undefined,
                maxLength: field.max
                  ? {
                      value: field.max,
                      message: `Maximum ${field.max} characters`,
                    }
                  : undefined,
                validate: field.validate,
              }}
              render={({ field: controllerField }) => (
                <RenderField
                  field={field}
                  value={formState[field.name] as string}
                  updateField={(_name, value) => {
                    controllerField.onChange(value);

                    // if (mutationMode === 'field') {
                    //   // queueMicrotask(() => {
                    //   //   updateField(_name, value)
                    //   // })
                    //  updateField(_name, value)
                    // }
                    updateField(_name, value);
                  }}
                  disabled={field.disabled}
                  error={errors[field.name]?.message as string}
                />
              )}
            />
          </Grid.Col>
        ))}
      </Grid>

      {(mutationMode === 'row' || mutationMode === 'collection') && (
        <Group gap="xs" justify="flex-end">
          <ActionIcon variant="light" size="sm" onClick={handleSubmit(handleAddRow)}>
            <Plus size={16} />
          </ActionIcon>
        </Group>
      )}

      {mutationMode === 'collection' && localRows.length > 0 && (
        <>
          <DataTable
            columns={columns || []}
            rows={localRows}
            isLoading={false}
            errorLoading={false}
            actionCellProps={{
              onDelete: handleDelete,
            }}
          />

          <Button size="xs" leftSection={<Save size={14} />} onClick={handleSave}>
            Save
          </Button>
        </>
      )}
    </Stack>
  );
}

export const FieldGroup = memo(FieldGroupComponent);
