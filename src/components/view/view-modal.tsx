import { Modal, Text, Title, Group, ActionIcon } from '@mantine/core';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

export function ViewModal<T = any>({ config, row, open, onClose }: ViewModalProps<T>) {
  // Hooks must run unconditionally; fall back to the module provider only when
  // the config does not supply its own API client.
  const fallbackApiProvider = useApiProvider();
  const apiProvider = config.apiProvider ?? fallbackApiProvider;
  const view = deriveView(config) as View<T>;

  // Loaded detail data, or the row itself when there's no id/endpoint to fetch from.
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => {
    if (!open || !view) {
      // eslint-disable-next-line react/set-state-in-effect
      setData(null);
      // eslint-disable-next-line react/set-state-in-effect
      setError(null);
      // eslint-disable-next-line react/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const id = row.id ?? row._id;
    if (!id) {
      // No identifier to fetch with — render the row as-is.
      // eslint-disable-next-line react/set-state-in-effect
      setData(row as T);
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react/set-state-in-effect
    setIsLoading(true);
    // eslint-disable-next-line react/set-state-in-effect
    setError(null);

    const endpoint = view.endpoint.replace(':id', String(id));
    apiProvider
      .get(endpoint)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const payload = response.data?.data?.data ?? response.data?.data ?? response.data;
        // eslint-disable-next-line react/set-state-in-effect
        setData(payload ?? null);
        // eslint-disable-next-line react/set-state-in-effect
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        // eslint-disable-next-line react/set-state-in-effect
        setError('Failed to load record details.');
        // eslint-disable-next-line react/set-state-in-effect
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, view, row, apiProvider]);

  const renderData = data ?? row;

  if (!open) {
    return null;
  }

  return (
    <Modal opened={open} onClose={onClose} size="xl" withCloseButton>
      <Group justify="space-between" align="center" pb="md">
        <Title order={2}>{view?.title ?? config.title}</Title>
        <ActionIcon variant="subtle" size="sm" onClick={onClose}>
          <X size={16} />
        </ActionIcon>
      </Group>
      {isLoading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading…
        </Text>
      ) : error ? (
        <Text c="red" ta="center" py="xl">
          {error}
        </Text>
      ) : (
        <GenericViewComponent view={view} data={renderData as any} />
      )}
    </Modal>
  );
}
