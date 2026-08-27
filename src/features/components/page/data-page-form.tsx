import { Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModuleContext } from '@/context/module-context';
import type { ModelConfig } from '@/features/shared/model-schema';
import { collectFields, normalizeMultiSelectIds } from '@/features/shared/payload-utils';
import { getDirtyFields } from '@/features/components/utils';
import { FieldGroup } from '../form/FieldGroup';
import { TabGroups } from '../form/tab-groups';
import { RxPage } from './rx-page';

type DataPageFormProps = {
  config: ModelConfig;
  initialData?: Record<string, unknown> | null;
  mode?: 'create' | 'edit';
  onSave?: () => void;
  onSaved?: (data: Record<string, unknown>) => void;
};

export function DataPageForm({
  config,
  initialData,
  mode = 'create',
  onSave,
  onSaved,
}: DataPageFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const moduleContext = useModuleContext();
  const apiProvider = config.apiProvider ?? moduleContext.apiProvider;

  const {
    title,
    description,
    endpoint,
    createFields,
    createFieldGroups,
    tabGroups,
    buildCreatePayload,
    buildUpdatePayload,
    buildFormState,
    defaultState,
    modalTitle,
    renderCreateExtras,
  } = config;

  const fieldGroups = createFieldGroups ?? (createFields ? [{ fields: createFields }] : []);
  const fields = collectFields({ createFields, createFieldGroups, tabGroups });

  const [formState, setFormState] = useState<Record<string, unknown>>(() =>
    mode === 'edit' && initialData && buildFormState
      ? buildFormState(initialData)
      : (defaultState ?? {})
  );

  useEffect(() => {
    if (mode === 'edit' && initialData && buildFormState) {
      setFormState(buildFormState(initialData));
    }
  }, [initialData, mode, buildFormState]);

  const updateField = (name: string, value: unknown) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const isWizard = Boolean(tabGroups);

  const [initialFormState, setInitialFormState] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (mode === 'edit' && initialData && buildFormState) {
      setInitialFormState(buildFormState(initialData));
    }
  }, [initialData, mode, buildFormState]);

  const mutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      if (mode === 'edit') {
        const id = initialData?.id ?? (values as any).id ?? (initialData as any)?._id;
        const changedValues = initialFormState
          ? getDirtyFields(values, initialFormState)
          : values;
        const normalized = normalizeMultiSelectIds(changedValues, fields);
        const payload = buildUpdatePayload
          ? buildUpdatePayload(normalized, initialData ?? {})
          : buildCreatePayload
            ? buildCreatePayload(normalized)
            : normalized;
        const response = await apiProvider!.patch(`${endpoint}/${String(id)}`, payload);
        return response.data as Record<string, unknown>;
      }
      const normalized = normalizeMultiSelectIds(values, fields);
      const payload = buildCreatePayload ? buildCreatePayload(normalized) : normalized;
      // Wizard create-and-continue: a prior step already POSTed the record, so
      // the final submit finalises it with a PATCH instead of creating a duplicate.
      const existingId = (values as any).id as string | undefined;
      if (existingId) {
        const response = await apiProvider!.patch(`${endpoint}/${String(existingId)}`, payload);
        return response.data as Record<string, unknown>;
      }
      const response = await apiProvider!.post(endpoint, payload);
      return response.data as Record<string, unknown>;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['rxsoft-data-page', endpoint],
      });
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
      void queryClient.invalidateQueries({ queryKey: ['rxsoft-detail', endpoint] });
      if (mode === 'edit' && data?.id) {
        void queryClient.invalidateQueries({ queryKey: [endpoint, String(data.id)] });
      }
      const action = mode === 'edit' ? 'updated' : 'created';
      notifications.show({ message: `${title} record ${action}` });
      onSaved?.(data);
      if (onSave) {
        onSave();
      } else {
        navigate({ to: '..' });
      }
    },
    onError: (error: any) => {
      const action = mode === 'edit' ? 'update' : 'create';
      notifications.show({
        color: 'red',
        message: `Failed to ${action} ${title.toLowerCase()} record - ${error.data?.message ?? error?.data?.error?.message ?? error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error.message}`,
      });
    },
  });

  const handleStepSubmit = async (_stepIndex: number): Promise<Record<string, unknown> | void> => {
    try {
      if (mode === 'edit') {
        const id = initialData?.id ?? (formState as any).id ?? (initialData as any)?._id;
        const changedValues = initialFormState
          ? getDirtyFields(formState, initialFormState)
          : formState;
        const normalized = normalizeMultiSelectIds(changedValues, fields);
        const payload = buildUpdatePayload
          ? buildUpdatePayload(normalized, initialData ?? {})
          : buildCreatePayload
            ? buildCreatePayload(normalized)
            : normalized;
        const response = await apiProvider!.patch(`${endpoint}/${String(id)}`, payload);
        return response.data as Record<string, unknown>;
      }
      const normalized = normalizeMultiSelectIds(formState, fields);
      const payload = buildCreatePayload ? buildCreatePayload(normalized) : normalized;
      const response = await apiProvider!.post(endpoint, payload);
      const data = response.data as Record<string, unknown>;
      setFormState((prev) => ({ ...prev, id: data.id as string }));
      return data;
    } catch (error: any) {
      const action = mode === 'edit' ? 'update' : 'create';
      notifications.show({
        color: 'red',
        message: `Failed to ${action} ${title.toLowerCase()} record - ${error.data?.message ?? error?.data?.error?.message ?? error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error.message}`,
      });
      throw error;
    }
  };

  const pageTitle = mode === 'edit' ? `Edit ${title}` : (modalTitle ?? `Create ${title}`);

  return (
    <RxPage title={pageTitle} description={description}>
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          {mode === 'edit'
            ? `Editing the ${title.toLowerCase()} record.`
            : `Add a new record to the ${title.toLowerCase()} module.`}
        </Text>

        <Stack gap="xl">
          {tabGroups ? (
            <TabGroups
              tabGroups={tabGroups}
              formState={formState}
              updateField={updateField}
              onSubmit={() => mutation.mutate(formState)}
              isPending={mutation.isPending}
              onStepSubmit={handleStepSubmit}
            />
          ) : (
            <>
              {fieldGroups.map((fieldGroup, index) => (
                <FieldGroup
                  key={index}
                  title={fieldGroup.title}
                  index={index}
                  fieldGroup={fieldGroup}
                  formState={formState}
                  updateField={updateField}
                />
              ))}
              {renderCreateExtras?.({
                formState,
                updateField,
              })}
            </>
          )}
        </Stack>

        {!isWizard && (
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => (onSave ? onSave() : navigate({ to: '..' }))}>
              Cancel
            </Button>
            <Button
              onClick={() => mutation.mutate(formState)}
              disabled={mutation.isPending}
              leftSection={mutation.isPending ? <Loader size={16} /> : null}
            >
              {mode === 'edit' ? 'Update' : 'Create'}
            </Button>
          </Group>
        )}
      </Stack>
    </RxPage>
  );
}
