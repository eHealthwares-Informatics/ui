import { Modal, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { GenericViewComponent } from '@/components/view';
import { deriveView } from '@/components/view/derive-view';
import { useApiProvider } from '@/context/module-context';
import type { View } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';

type ViewModalProps<T = any> = {
  config: ModelConfig<T>;
  row: Record<string, unknown>;
  open: boolean;
  onClose: () => void;
};

function unwrapDetail<T>(payload: any): T | null {
  return (payload?.data?.data ?? payload?.data ?? payload ?? null) as T | null;
}

export function ViewModal<T = any>({ config, row, open, onClose }: ViewModalProps<T>) {
  // Hooks must run unconditionally; fall back to the module provider only when
  // the config does not supply its own API client.
  const fallbackApiProvider = useApiProvider();
  const apiProvider = config.apiProvider ?? fallbackApiProvider;
  // `deriveView` builds a fresh object on every call — memoize it so the query
  // below is not re-created on each render.
  const view = useMemo(() => deriveView(config) as View<T>, [config]);

  const id = row.id ?? row._id;
  const endpoint = id && view?.endpoint ? view.endpoint.replace(':id', String(id)) : null;

  // React Query de-dupes identical requests (including StrictMode's double
  // effect run) and caches the detail, so opening a row fires exactly one GET.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['view-modal', config.id ?? 'view', endpoint],
    queryFn: async () => {
      const response = await apiProvider.get(endpoint as string);
      return unwrapDetail<T>(response.data);
    },
    enabled: open && Boolean(endpoint),
  });

  if (!open) {
    return null;
  }

  const renderData = data ?? row;

  return (
    <Modal
      opened={open}
      onClose={onClose}
      size="xl"
      withCloseButton
      data-testid="view-modal"
      styles={{ body: { paddingTop: 8 } }}
    >
      {/* The record title is rendered once by GenericViewComponent; adding a
          Modal title here duplicated it (and the close button). */}
      {endpoint && isLoading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading…
        </Text>
      ) : isError ? (
        <Text c="red" ta="center" py="xl">
          Failed to load record details.
        </Text>
      ) : (
        <GenericViewComponent view={view} data={renderData as any} />
      )}
    </Modal>
  );
}
