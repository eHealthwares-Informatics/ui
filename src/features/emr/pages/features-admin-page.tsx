import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AlertCircle, ExternalLink, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { EMRSubModule, Feature, FormDefinition } from '../lib/emr-types';
import { FeatureModal, type RoleOption } from './sub-modules/feature-modal';

const PAGE_SIZE = 20;

/**
 * Global Features configuration: create a feature by choosing a Module and a
 * Form. Forms themselves are managed under Configuration → Forms.
 */
export function FeaturesAdminPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editing, setEditing] = useState<Feature | null>(null);

  const featuresQuery = useQuery({
    queryKey: ['emr', 'features', 'admin', page, search],
    queryFn: async () => {
      const { data } = await emrApi.get<{
        data: Feature[];
        meta: { page: number; limit: number; total: number };
      }>('/features', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      return data;
    },
  });

  const modulesQuery = useQuery({
    queryKey: ['emr', 'sub-modules', 'options'],
    queryFn: async () => {
      const { data } = await emrApi.get<{ data: EMRSubModule[] }>('/sub-modules', {
        params: { limit: 1000 },
      });
      return data.data;
    },
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

  const rows = featuresQuery.data?.data ?? [];
  const total = featuresQuery.data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['emr', 'features'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'sub-modules'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'form-definitions'] });
    void queryClient.invalidateQueries({ queryKey: ['emr', 'forms'] });
    void queryClient.invalidateQueries({
      queryKey: ['emr', 'sub-modules', 'navigation'],
    });
  }

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
      breadcrumbs={[{ label: 'Configuration' }, { label: 'Features' }]}
      title="Features"
      description="Create a feature by choosing its module and form. A feature's page is the form's records CRUD."
      actions={
        <Button
          leftSection={<Plus size={16} />}
          onClick={openCreate}
          data-testid="features-admin-new-button"
        >
          New Feature
        </Button>
      }
    >
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search features…"
            leftSection={<Search size={15} />}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
              setPage(1);
            }}
            data-testid="features-admin-search-input"
            style={{ maxWidth: 320 }}
          />
          <Text size="xs" c="dimmed">
            {total} feature{total === 1 ? '' : 's'}
          </Text>
        </Group>

        {featuresQuery.isError ? (
          <Alert color="red" icon={<AlertCircle size={16} />}>
            {getApiErrorMessage(featuresQuery.error) || 'Could not load features.'}
          </Alert>
        ) : (
          <Card withBorder radius="md" padding={0}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Form / Feature</Table.Th>
                  <Table.Th>Module</Table.Th>
                  <Table.Th>Encounter type</Table.Th>
                  <Table.Th>Roles</Table.Th>
                  <Table.Th>Order</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th style={{ width: 230 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {featuresQuery.isLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>Loading…</Table.Td>
                  </Table.Tr>
                ) : rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      No features yet. Create one after adding a form under Configuration → Forms.
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  rows.map((feature) => (
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
                      <Table.Td>{feature.subModule?.name ?? '—'}</Table.Td>
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
                              data-testid={`features-admin-open-${feature.id}`}
                            >
                              Open
                            </Button>
                          </Link>
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            onClick={() => openEdit(feature)}
                            data-testid={`features-admin-edit-${feature.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            color="red"
                            data-testid={`features-admin-remove-${feature.id}`}
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
            {totalPages > 1 && (
              <Group justify="flex-end" p="md">
                <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
              </Group>
            )}
          </Card>
        )}
      </Stack>

      <FeatureModal
        opened={modalOpened}
        onClose={closeModal}
        modules={(modulesQuery.data ?? []).map((module) => ({
          id: module.id,
          name: module.name,
        }))}
        feature={editing}
        forms={formsQuery.data ?? []}
        roles={rolesQuery.data ?? []}
        onSaved={refresh}
      />
    </RxPage>
  );
}
