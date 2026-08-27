import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { Field } from '@/features/rxsoft/types';
import { normalizeMultiSelectIds } from '@/features/shared/payload-utils';
import { useApiProvider } from '../../../context/module-context';
import { triggerBlobDownload } from '../export/download';
import { getDirtyFields } from '../utils';

type MutationProps = {
  endpoint: string;
  formState: Record<string, unknown>;
  queryClient: any;
  title: any;
  apiProvider?: AxiosInstance;
  fields?: Field[];
};

type CreateMutationProps = MutationProps & {
  buildCreatePayload?: (values: Record<string, unknown>) => unknown;
  buildUpdatePayload?: (values: Record<string, unknown>, row: Record<string, unknown>) => unknown;
  setShowModal: (value: boolean) => void;

  onCreateSuccess?: (
    created: Record<string, unknown>,
    values: Record<string, unknown>
  ) => Promise<void> | void;

  keepModalOpenOnSuccess?: boolean;
};

type UpdateMutationProps = MutationProps & {
  buildCreatePayload?: (values: Record<string, unknown>) => unknown;

  buildUpdatePayload?: (values: Record<string, unknown>, row: Record<string, unknown>) => unknown;
  editingRow: Record<string, unknown> | null;
  setEditingRow: (row: Record<string, unknown> | null) => void;
  setShowModal: (value: boolean) => void;
  initialFormState?: Record<string, unknown>;
};

type DeteleMutationProps = MutationProps & {
  deletePathBuilder?: (row: Record<string, unknown>) => string;
  queryClient: any;
};

type ExportMutationProps = MutationProps & {
  csvEndpoint?: string;
};

export const useCreateMutation = ({
  buildCreatePayload,
  onCreateSuccess,
  endpoint,
  formState,
  queryClient,
  setShowModal,
  title,
  apiProvider,
  keepModalOpenOnSuccess = false,
  fields,
}: CreateMutationProps) => {
  const contextApiProvider = useApiProvider();
  const effectiveApiProvider = apiProvider ?? contextApiProvider;

  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const normalized = normalizeMultiSelectIds(values, fields ?? []);
      const payload = buildCreatePayload ? buildCreatePayload(normalized) : normalized;
      const response = await effectiveApiProvider!.post(endpoint, payload);
      return response.data as Record<string, unknown>;
    },
    onSuccess: async (created) => {
      if (onCreateSuccess) {
        await onCreateSuccess(created, formState);
      }
      void queryClient.invalidateQueries({
        queryKey: ['rxsoft-data-page', endpoint],
      });
      if (!keepModalOpenOnSuccess) {
        setShowModal(false);
      }
      notifications.show({ message: `${title} record created` });
    },
    onError: (error: any) => {
      notifications.show({
        color: 'red',
        message: `Failed to create ${title.toLowerCase()} record - ${error.data?.message ?? error?.data?.error?.message ?? error?.response?.data?.message ?? error?.response?.data?.error?.message ?? error.message}`,
      });
    },
  });
};

export const useUpdateMutation = ({
  buildCreatePayload,
  endpoint,
  queryClient,
  title,
  buildUpdatePayload,
  setEditingRow,
  editingRow,
  setShowModal,
  apiProvider,
  initialFormState,
  fields,
}: UpdateMutationProps) => {
  const contextApiProvider = useApiProvider();
  const effectiveApiProvider = apiProvider ?? contextApiProvider;
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const recordId = editingRow?.id ?? editingRow?._id;
      if (!recordId) {
        throw new Error('Missing record id');
      }
      const changedValues = initialFormState ? getDirtyFields(values, initialFormState) : values;
      const normalized = normalizeMultiSelectIds(changedValues, fields ?? []);
      const payload = buildUpdatePayload
        ? buildUpdatePayload(normalized, editingRow as Record<string, unknown>)
        : buildCreatePayload
          ? buildCreatePayload(normalized)
          : normalized;
      const response = await effectiveApiProvider!.patch(
        `${endpoint}/${String(recordId)}`,
        payload
      );
      return { data: response.data as Record<string, unknown>, recordId };
    },
    onSuccess: ({ recordId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['rxsoft-data-page', endpoint],
      });
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
      void queryClient.invalidateQueries({ queryKey: ['rxsoft-detail', endpoint] });
      if (recordId) {
        void queryClient.invalidateQueries({ queryKey: [endpoint, String(recordId)] });
      }
      setShowModal(false);
      setEditingRow(null);
      notifications.show({ message: `${title} record updated` });
    },
    onError: (error: any) => {
      console.log({error})
      notifications.show({
        message: `Failed to update ${title.toLowerCase()} record - ${error?.data?.error?.message ?? error?.response?.data?.error?.message}`,
      });
    },
  });
};

export const useDeleteMutation = ({
  deletePathBuilder,
  endpoint,
  queryClient,
  title,
  apiProvider,
}: DeteleMutationProps) => {
  const contextApiProvider = useApiProvider();
  const effectiveApiProvider = apiProvider ?? contextApiProvider;

  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const target = deletePathBuilder
        ? deletePathBuilder(row)
        : `${endpoint}/${String(row.id ?? row._id)}`;
      await effectiveApiProvider.delete(target);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['rxsoft-data-page', endpoint],
      });
      notifications.show({ message: `${title} record deleted` });
    },
    onError: () => {
      notifications.show({
        color: 'red',
        message: `Failed to delete ${title.toLowerCase()} record`,
      });
    },
  });
};

export const useExportMutation = ({ csvEndpoint, title, apiProvider }: ExportMutationProps) => {
  const contextApiProvider = useApiProvider();
  const effectiveApiProvider = apiProvider ?? contextApiProvider;

  return useMutation({
    mutationFn: async (params?: Record<string, unknown>) => {
      if (!csvEndpoint) {
        return;
      }
      await triggerBlobDownload(
        effectiveApiProvider!,
        { method: 'GET', url: csvEndpoint, params },
        `${title.toLowerCase().replace(/\s+/g, '_')}.csv`,
      );
    },
    onSuccess: () => notifications.show({ message: `${title} export downloaded` }),
    onError: () =>
      notifications.show({ color: 'red', message: `Failed to export ${title.toLowerCase()}` }),
  });
};
