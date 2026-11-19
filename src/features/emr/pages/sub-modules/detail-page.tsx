import { Alert, Badge, Group, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { RxPage } from '@/components/page/rx-page';
import type { Column } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { emrApi } from '@/lib/emr-api';
import { StatusBadge } from '../../components/shared/status-badge';
import { formatEnum } from '../../lib/emr-constants';
import { getApiErrorMessage } from '../../lib/emr-errors';
import type { EMRSubModule, Feature, FormDefinition } from '../../lib/emr-types';
import { FeatureModal, type RoleOption } from './feature-modal';

export function SubModuleDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<Feature | null>(null);

  const subModuleQuery = useQuery({
    queryKey: ['emr', 'sub-modules', id],
    queryFn: async () => {
      const { data } = await emrApi.get<EMRSubModule>(`/sub-modules/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  const formsQuery = useQuery({
    queryKey: ['emr', 'form-definitions', 'all'],
    queryFn: async () => {
      const { data } = await emrApi.get<{ data: FormDefinition[] }>('/form-definitions', {
        params: { limit: 1000 },
      });
      return data.data;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ['emr', 'sub-modules', 'role-options'],
    queryFn: async () => {
      const { data } = await emrApi.get<{ data: RoleOption[] }>('/sub-modules/role-options');
      return data.data;
    },
    staleTime: 60_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['emr', 'features'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules', 'navigation'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (featureId: string) => {
      await emrApi.delete(`/features/${featureId}`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Feature removed', color: 'teal' });
      refresh();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const openEdit = (feature: Feature) => {
    setEditing(feature);
    openModal();
  };

  const subModule = subModuleQuery.data;
  const featureCount = subModule?.features?.length ?? 0;

  const config = useMemo<ModelConfig>(() => {
    const columns: Column[] = [
      {
        key: 'form',
        label: 'Form / Feature',
        render: (row) => {
          const form = row.form as FormDefinition | undefined;
          return (
            <Stack gap={2}>
              <Text size="sm" fw={600}>
                {form?.name ?? 'Form missing'}
              </Text>
              <Group gap={4}>
                <Text size="xs" c="dimmed">
                  {form?.code ?? String(row.formDefinitionId ?? '—')}
                </Text>
                {form && (
                  <Badge size="xs" variant="light" color={form.isPublished ? 'teal' : 'gray'}>
                    {form.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                )}
              </Group>
            </Stack>
          );
        },
      },
      {
        key: 'encounterType',
        label: 'Encounter type',
        render: (row) => formatEnum(String(row.encounterType ?? '')),
      },
      {
        key: 'roleCodes',
        label: 'Roles',
        render: (row) => {
          const roles = row.roleCodes as string[] | undefined;
          return roles?.length ? (
            <Group gap={4} wrap="wrap">
              {roles.map((code) => (
                <Badge key={code} size="xs" variant="light">
                  {code}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text size="xs" c="dimmed">
              Everyone
            </Text>
          );
        },
      },
      {
        key: 'sortOrder',
        label: 'Order',
        render: (row) => String(row.sortOrder ?? 0),
      },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => <StatusBadge value={row.isActive} kind="active" />,
      },
    ];

    return {
      id: 'emr-submodule-features',
      title: subModule?.name ?? 'Module',
      description:
        subModule?.description ??
        'Features are forms with role-based menu access and their own submissions CRUD.',
      endpoint: '/features',
      apiProvider: emrApi,
      queryKeyBase: ['emr', 'features', 'submodule', id],
      listParamStyle: 'plain',
      listParams: { subModuleId: id },
      columns,
      defaultSort: { sortBy: 'sortOrder', sortOrder: 'asc' },
      rowActions: [
        {
          label: 'Open',
          icon: ExternalLink,
          href: (row) => `/emr/features/${String(row.id)}`,
        },
        {
          label: 'Edit',
          icon: Pencil,
          onClick: (row) => openEdit(row as unknown as Feature),
        },
        {
          label: 'Remove',
          icon: Trash2,
          onClick: (row) => deleteMutation.mutate(String(row.id)),
        },
      ],
      canDelete: false,
      renderCreateModal: ({ onClose, refresh: refreshList }) => (
        <FeatureModal
          opened
          onClose={onClose}
          subModuleId={id}
          feature={null}
          forms={formsQuery.data ?? []}
          roles={rolesQuery.data ?? []}
          onSaved={() => {
            refreshList();
            refresh();
          }}
        />
      ),
    };
  }, [deleteMutation, formsQuery.data, id, refresh, rolesQuery.data, subModule]);

  return (
    <RxPage
      breadcrumbs={[
        { label: 'Configuration' },
        { label: 'Modules', href: '/emr/modules' },
        { label: subModule?.name ?? 'Module' },
      ]}
      title={subModule?.name ?? 'Module'}
      description={
        subModule?.description ??
        'Features are forms with role-based menu access and their own submissions CRUD.'
      }
    >
      {subModuleQuery.isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : subModuleQuery.isError || !subModule ? (
        <Alert color="red">{getApiErrorMessage(subModuleQuery.error) || 'Module not found.'}</Alert>
      ) : (
        <Stack gap="md">
          <Group gap="xs">
            <Badge variant="light">{subModule.code}</Badge>
            <StatusBadge value={subModule.isActive} kind="active" />
            <Text size="xs" c="dimmed">
              {featureCount} feature{featureCount === 1 ? '' : 's'}
            </Text>
          </Group>
          <DataPageShell config={config} embedded />
        </Stack>
      )}

      <FeatureModal
        opened={modalOpened}
        onClose={closeModal}
        subModuleId={id}
        feature={editing}
        forms={formsQuery.data ?? []}
        roles={rolesQuery.data ?? []}
        onSaved={refresh}
      />
    </RxPage>
  );
}
