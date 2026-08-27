import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Menu,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';
import { FormBuilderModal } from '../components/forms/form-builder-modal';
import { StatusBadge } from '../components/shared/status-badge';
import { formatEnum } from '../lib/emr-constants';
import { getApiErrorMessage } from '../lib/emr-errors';
import type { FormDefinition } from '../lib/emr-types';

export function FormsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [builderOpened, { open: openBuilder, close: closeBuilder }] = useDisclosure(false);
  const [editing, setEditing] = useState<FormDefinition | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', 'form-definitions', page, search],
    queryFn: async () => {
      const res = await emrApi.get<{
        data: FormDefinition[];
        meta: { page: number; limit: number; total: number };
      }>('/form-definitions', { params: { page, limit: 20, search: search || undefined } });
      return res.data;
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['emr', 'form-definitions'] });
    queryClient.invalidateQueries({ queryKey: ['emr', 'forms'] });
  };

  const publishMutation = useMutation({
    mutationFn: async (form: FormDefinition) => {
      const { data } = await emrApi.post(`/form-definitions/${form.id}/publish`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Form published', color: 'teal' });
      invalidate();
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
      invalidate();
    },
    onError: (error) => {
      notifications.show({ color: 'red', message: getApiErrorMessage(error) });
    },
  });

  const openCreate = () => {
    setEditing(null);
    openBuilder();
  };

  const openEdit = (form: FormDefinition) => {
    setEditing(form);
    openBuilder();
  };

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: 'Forms' }]}
      title="Form Definitions"
      description="Build and publish dynamic clinical forms used by the Documentation feature."
      actions={
        <Button leftSection={<Plus size={16} />} onClick={openCreate}>
          New Form
        </Button>
      }
    >
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search forms…"
            leftSection={<Search size={15} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            style={{ maxWidth: 320 }}
          />
          <Text size="xs" c="dimmed">
            {total} forms
          </Text>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Version</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Fields</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ width: 48 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>Loading…</Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>No form definitions found.</Table.Td>
                </Table.Tr>
              ) : (
                rows.map((form) => (
                  <Table.Tr key={form.id}>
                    <Table.Td>
                      <Badge variant="light">{form.code}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {form.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>v{form.version}</Table.Td>
                    <Table.Td>{formatEnum(form.category)}</Table.Td>
                    <Table.Td>{form.schemaJson?.fields?.length ?? 0}</Table.Td>
                    <Table.Td>
                      <StatusBadge value={form.isPublished} kind="active" />
                    </Table.Td>
                    <Table.Td>
                      <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                          <ActionIcon variant="subtle" aria-label="Form actions">
                            <MoreHorizontal size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => openEdit(form)}>Edit</Menu.Item>
                          {form.isPublished ? (
                            <Menu.Item
                              color="red"
                              disabled={unpublishMutation.isPending}
                              onClick={() => unpublishMutation.mutate(form)}
                            >
                              Unpublish
                            </Menu.Item>
                          ) : (
                            <Menu.Item
                              disabled={publishMutation.isPending}
                              onClick={() => publishMutation.mutate(form)}
                            >
                              Publish
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
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
      </Stack>

      <FormBuilderModal
        opened={builderOpened}
        onClose={closeBuilder}
        initial={editing}
      />
    </RxPage>
  );
}
