import { Badge, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ban, Pencil, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { RxPage } from '@/components/page/rx-page';
import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { FormBuilderModal } from '../components/forms/form-builder-modal';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { FormDefinition } from '../lib/emr-types';

export function FormsPage() {
  const queryClient = useQueryClient();
  const [builderOpened, { open: openBuilder, close: closeBuilder }] = useDisclosure(false);
  const [editing, setEditing] = useState<FormDefinition | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['emr', 'form-definitions'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'forms'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules', 'navigation'] });
  };

  const publishMutation = useMutation({
    mutationFn: async (form: FormDefinition) => {
      const { data } = await emrApi.post(`/form-definitions/${form.id}/publish`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Form published', color: 'teal' });
      refresh();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: async (form: FormDefinition) => {
      const { data } = await emrApi.post(`/form-definitions/${form.id}/unpublish`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Form unpublished' });
      refresh();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const openEdit = (form: FormDefinition) => {
    setEditing(form);
    openBuilder();
  };

  const config = useMemo<ModelConfig>(() => {
    const columns: Column[] = [
      {
        key: 'code',
        label: 'Code',
        render: (row) => <Badge variant="light">{String(row.code ?? '—')}</Badge>,
      },
      {
        key: 'name',
        label: 'Name',
        render: (row) => (
          <Stack gap={0}>
            <Text size="sm" fw={600}>
              {String(row.name ?? '—')}
            </Text>
            {row.description ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {String(row.description)}
              </Text>
            ) : null}
          </Stack>
        ),
      },
      {
        key: 'version',
        label: 'Version',
        render: (row) => `v${String(row.version ?? '—')}`,
      },
      {
        key: 'category',
        label: 'Category',
        render: (row) => formatEnum(String(row.category ?? '')),
      },
      {
        key: 'fields',
        label: 'Fields',
        render: (row) => {
          const form = row as unknown as FormDefinition;
          return String(form.schemaJson?.fields?.length ?? 0);
        },
      },
      {
        key: 'isPublished',
        label: 'Status',
        render: (row) => <StatusBadge value={Boolean(row.isPublished)} kind="active" />,
      },
    ];

    return {
      id: 'emr-forms',
      title: 'Form Definitions',
      description: 'Build and publish dynamic clinical forms used by the Documentation feature.',
      endpoint: '/form-definitions',
      apiProvider: emrApi,
      queryKeyBase: ['emr', 'form-definitions', 'page'],
      listParamStyle: 'plain',
      columns,
      defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
      rowActions: [
        {
          label: 'Edit',
          icon: Pencil,
          onClick: (row) => openEdit(row as unknown as FormDefinition),
        },
        {
          label: 'Publish',
          icon: Upload,
          validate: (row) => !row.isPublished,
          onClick: (row) => publishMutation.mutate(row as unknown as FormDefinition),
        },
        {
          label: 'Unpublish',
          icon: Ban,
          validate: (row) => Boolean(row.isPublished),
          onClick: (row) => unpublishMutation.mutate(row as unknown as FormDefinition),
        },
      ],
      canDelete: false,
      renderCreateModal: ({ onClose, refresh: refreshList }) => (
        <FormBuilderModal opened onClose={onClose} onSaved={refreshList} />
      ),
    };
  }, [publishMutation, unpublishMutation]);

  return (
    <RxPage
      breadcrumbs={[{ label: 'Configuration' }, { label: 'Forms' }]}
      title="Form Definitions"
      description="Build and publish dynamic clinical forms used by the Documentation feature."
    >
      <DataPageShell config={config} embedded />

      <FormBuilderModal
        opened={builderOpened}
        onClose={closeBuilder}
        initial={editing}
        onSaved={refresh}
      />
    </RxPage>
  );
}
