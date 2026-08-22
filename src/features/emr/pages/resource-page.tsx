import {
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { RxPage } from '@/features/components/page/rx-page';
import { emrApi } from '@/lib/emr-api';

export type EmrListColumn = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => ReactNode;
};

export type EmrResourceConfig = {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  columns: EmrListColumn[];
  badgeKey?: string;
  createLabel?: string;
  createForm?: React.FC<{ onCreated: () => void; onClose: () => void }>;
  actions?: (row: Record<string, unknown>) => ReactNode;
  rowLink?: (row: Record<string, unknown>) => string | undefined;
};

export function EmrResourcePage({ config }: { config: EmrResourceConfig }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', config.key, page, search],
    queryFn: async () => {
      const { data: res } = await emrApi.get<{
        data: Record<string, unknown>[];
        meta: { page: number; limit: number; total: number };
      }>(config.endpoint, {
        params: { page, limit: 20, search: search || undefined },
      });
      return res;
    },
  });

  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const CreateForm = config.createForm;
  const columnCount = config.columns.length + (config.actions ? 1 : 0);

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: config.title }]}
      title={config.title}
      description={config.description}
      actions={
        <Button leftSection={<Plus size={16} />} onClick={open}>
          {config.createLabel ?? `Add ${config.title.replace(/s$/, '')}`}
        </Button>
      }
    >
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search…"
            leftSection={<Search size={15} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            style={{ maxWidth: 320 }}
          />
          <Text size="xs" c="dimmed">
            {total} records
          </Text>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {config.columns.map((col) => (
                  <Table.Th key={col.key}>{col.label}</Table.Th>
                ))}
                {config.actions && <Table.Th style={{ width: 48 }} />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={columnCount}>Loading…</Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={columnCount}>No records found.</Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row, index) => {
                  const rowTo = config.rowLink?.(row);
                  return (
                    <Table.Tr
                      key={String(row.id ?? index)}
                      style={rowTo ? { cursor: 'pointer' } : undefined}
                      onClick={
                        rowTo
                          ? () => {
                              void navigate({ to: rowTo });
                            }
                          : undefined
                      }
                    >
                      {config.columns.map((col) => (
                        <Table.Td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '—')}</Table.Td>
                      ))}
                      {config.actions && <Table.Td onClick={(e) => e.stopPropagation()}>{config.actions(row)}</Table.Td>}
                    </Table.Tr>
                  );
                })
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

      <Modal
        opened={opened}
        onClose={close}
        title={config.createLabel ?? `Add ${config.title.replace(/s$/, '')}`}
        size={CreateForm ? 'lg' : 'md'}
        centered
      >
        {CreateForm ? (
          <CreateForm onCreated={close} onClose={close} />
        ) : (
          <Stack>
            <Text size="sm" c="dimmed">
              Creating {config.title.toLowerCase()} directly is not available yet — use the
              operational flows (patient registration, appointment scheduling) to build up records.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={close}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </RxPage>
  );
}
