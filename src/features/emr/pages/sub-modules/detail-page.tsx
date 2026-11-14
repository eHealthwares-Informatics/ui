import { Alert, Badge, Button, Card, Group, Loader, Stack, Table, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/components/page/rx-page';
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
      const { data } = await emrApi.get<{
        data: FormDefinition[];
      }>('/form-definitions', { params: { limit: 1000 } });
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

  const deleteMutation = useMutation({
    mutationFn: async (featureId: string) => {
      await emrApi.delete(`/features/${featureId}`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Feature removed', color: 'teal' });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules'] });
      void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules', 'navigation'] });
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const subModule = subModuleQuery.data;
  const features = subModule?.features ?? [];

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules', id] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules', 'navigation'] });
  };

  const openCreate = () => {
    setEditing(null);
    openModal();
  };

  const openEdit = (feature: Feature) => {
    setEditing(feature);
    openModal();
  };

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
      actions={
        <Button
          leftSection={<Plus size={16} />}
          onClick={openCreate}
          data-testid="submodule-new-feature-button"
        >
          New Feature
        </Button>
      }
    >
      {subModuleQuery.isLoading ? (
        <Group justify="center" py="xl">
          <Loader size="sm" />
        </Group>
      ) : subModuleQuery.isError || !subModule ? (
        <Alert color="red" icon={<AlertCircle size={16} />}>
          {getApiErrorMessage(subModuleQuery.error) || 'Module not found.'}
        </Alert>
      ) : (
        <Stack gap="md">
          <Group gap="xs">
            <Badge variant="light">{subModule.code}</Badge>
            <StatusBadge value={subModule.isActive} kind="active" />
            <Text size="xs" c="dimmed">
              {features.length} feature{features.length === 1 ? '' : 's'}
            </Text>
          </Group>

          <Card withBorder radius="md" padding={0}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Form / Feature</Table.Th>
                  <Table.Th>Encounter type</Table.Th>
                  <Table.Th>Roles</Table.Th>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th style={{ width: 220 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {features.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>No features yet. Create one to add a menu item.</Table.Td>
                  </Table.Tr>
                ) : (
                  features
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((feature) => (
                      <Table.Tr key={feature.id}>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text size="sm" fw={600}>
                              {feature.form?.name ?? 'Form missing'}
                            </Text>
                            <Group gap={4}>
                              <Text size="xs" c="dimmed">
                                {feature.form?.code ?? feature.formDefinitionId}
                              </Text>
                              {feature.form && (
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={feature.form.isPublished ? 'teal' : 'gray'}
                                >
                                  {feature.form.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              )}
                            </Group>
                          </Stack>
                        </Table.Td>
                        <Table.Td>{formatEnum(feature.encounterType)}</Table.Td>
                        <Table.Td>
                          <Group gap={4} wrap="wrap">
                            {feature.roleCodes?.length ? (
                              feature.roleCodes.map((code) => (
                                <Badge key={code} size="xs" variant="light">
                                  {code}
                                </Badge>
                              ))
                            ) : (
                              <Text size="xs" c="dimmed">
                                Everyone
                              </Text>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>{feature.sortOrder}</Table.Td>
                        <Table.Td>
                          <StatusBadge value={feature.isActive} kind="active" />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Link to="/emr/features/$featureId" params={{ featureId: feature.id }}>
                              <Button
                                size="compact-xs"
                                variant="light"
                                rightSection={<ExternalLink size={12} />}
                                data-testid={`feature-open-${feature.id}`}
                              >
                                Open
                              </Button>
                            </Link>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              onClick={() => openEdit(feature)}
                              data-testid={`feature-edit-${feature.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="red"
                              data-testid={`feature-remove-${feature.id}`}
                              loading={
                                deleteMutation.isPending && deleteMutation.variables === feature.id
                              }
                              onClick={() => deleteMutation.mutate(feature.id)}
                            >
                              Remove
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
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
