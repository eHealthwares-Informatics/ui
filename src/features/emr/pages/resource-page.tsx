import {
  Badge,
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
};

function defaultBadge(value: unknown) {
  return <Badge variant="light">{String(value ?? '—')}</Badge>;
}

export function EmrResourcePage({ config }: { config: EmrResourceConfig }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);

  const { data, isLoading } = useQuery({
    queryKey: ['emr', config.key, page, search],
    queryFn: async () => {
      const { data: res } = await emrApi.get<{
        data: Record<string, unknown>[];
        total: number;
      }>(config.endpoint, {
        params: { page, limit: 20, search: search || undefined },
      });
      return res;
    },
  });

  const rows = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));

  return (
    <RxPage
      breadcrumbs={[{ label: 'EMR' }, { label: config.title }]}
      title={config.title}
      description={config.description}
      actions={
        <Button leftSection={<Plus size={16} />} onClick={open}>
          Add {config.title.replace(/s$/, '')}
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
            {data?.total ?? 0} records
          </Text>
        </Group>

        <Card withBorder radius="md" padding={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {config.columns.map((col) => (
                  <Table.Th key={col.key}>{col.label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={config.columns.length}>Loading…</Table.Td>
                </Table.Tr>
              ) : rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={config.columns.length}>No records found.</Table.Td>
                </Table.Tr>
              ) : (
                rows.map((row, index) => (
                  <Table.Tr key={String(row.id ?? index)}>
                    {config.columns.map((col) => (
                      <Table.Td key={col.key}>
                        {col.render
                          ? col.render(row)
                          : col.key === config.badgeKey
                            ? defaultBadge(row[col.key])
                            : String(row[col.key] ?? '—')}
                      </Table.Td>
                    ))}
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

      <Modal opened={opened} onClose={close} title={`Add ${config.title.replace(/s$/, '')}`} centered>
        <Stack>
          <Text size="sm" c="dimmed">
            Full create form is wired up in the EMR visit workspace. Create a patient record first,
            then schedule appointments from the patient profile.
          </Text>
          <TextInput label="Patient ID" placeholder="Enter patient id" />
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={close}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>
    </RxPage>
  );
}
