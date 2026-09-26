import { Button, Modal, Text, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { getArrayPayload } from '@/features/components/utils';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { Option } from '@/features/rxsoft/types';
import { communicationApi } from '@/lib/communication-api';

export type CommunicationRow = Record<string, unknown>;

export function useCommunicationList(
  endpoint: string,
  search: string,
  extraParams?: Record<string, unknown>
) {
  return useQuery({
    queryKey: ['communication-engine', endpoint, search, extraParams] satisfies QueryKey,
    queryFn: async () => {
      const response = await communicationApi.get(endpoint, {
        params: {
          ...(extraParams ?? {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
      });
      return getArrayPayload(response.data);
    },
    staleTime: 30_000,
  });
}

export function useCommunicationCrud(endpoint: string) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await communicationApi.post(endpoint, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-engine', endpoint] });
      notifications.show({ message: 'Record created successfully' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
      method = 'patch',
    }: {
      id: string;
      payload: Record<string, unknown>;
      method?: 'patch' | 'put';
    }) => {
      const response =
        method === 'put'
          ? await communicationApi.put(`${endpoint}/${id}`, payload)
          : await communicationApi.patch(`${endpoint}/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-engine', endpoint] });
      notifications.show({ message: 'Record updated successfully' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await communicationApi.delete(`${endpoint}/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-engine', endpoint] });
      notifications.show({ message: 'Record deleted successfully' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getErrorMessage(error) });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
}

export function DialogActions({
  onSave,
  onCancel,
  isLoading = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}: {
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <Group justify="flex-end" mt="xl">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button onClick={onSave} loading={isLoading}>
        {saveLabel}
      </Button>
    </Group>
  );
}

export function LabelField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Text>
      {children}
    </Stack>
  );
}

export function JsonPreviewDialog({
  data,
  title,
  open,
  onOpenChange,
}: {
  data: Record<string, unknown>;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title={title} size="lg">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Raw JSON data for this record
        </Text>
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </Stack>
    </Modal>
  );
}

export function getString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

export function getOption(value: unknown): Option {
  return typeof value === 'string'
    ? { label: value, value }
    : { label: String(value ?? ''), value: String(value ?? '') };
}

export function getObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeRows(rows: unknown[]): CommunicationRow[] {
  return rows.map((row, index) => ({
    id: getString((row as any)?.id ?? index),
    ...getObject(row),
  }));
}

export function getDirtyPayload(
  original: Record<string, unknown>,
  current: Record<string, unknown>
): Record<string, unknown> {
  const dirty: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(current)) {
    if (JSON.stringify(original[key]) !== JSON.stringify(value)) {
      dirty[key] = value;
    }
  }

  return dirty;
}

function getErrorMessage(error: unknown): string {
  // Delegate to the shared extractor so 4xx envelopes surface the server's
  // message instead of axios's generic text.
  return getApiErrorMessage(error);
}
