import { Badge, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { journalEntriesConfig } from './schema';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const statusColors: Record<string, string> = {
  draft: 'yellow',
  posted: 'green',
  reversed: 'gray',
};

export function RxJournalEntriesPage() {
  const qc = useQueryClient();

  const postMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await rxsoftApi.post(`/journal-entries/${entryId}/post`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Journal entry posted.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    },
    onError: (error) => {
      notifications.show({ message: getApiErrorMessage(error), color: 'red' });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await rxsoftApi.post(`/journal-entries/${entryId}/reverse`);
    },
    onSuccess: () => {
      notifications.show({ message: 'Journal entry reversed.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    },
    onError: (error) => {
      notifications.show({ message: getApiErrorMessage(error), color: 'red' });
    },
  });

  const columns = journalEntriesConfig.columns!.map((col) => {
    if (col.key === 'status') {
      return {
        ...col,
        render: (row: Record<string, unknown>) => {
          const status = row.status as string;
          const color = statusColors[status] ?? 'gray';
          return <Badge color={color} variant="light">{status}</Badge>;
        },
      };
    }
    return col;
  });

  const actionColumn = {
    key: '_actions',
    label: '',
    render: (row: Record<string, unknown>) => {
      const status = row.status as string;
      const entryId = row.id as string;
      return (
        <Group gap="xs">
          {status === 'draft' && (
            <Button
              size="compact-xs"
              color="green"
              onClick={() => postMutation.mutate(entryId)}
              loading={postMutation.isPending}
            >
              Post
            </Button>
          )}
          {status === 'posted' && (
            <Button
              size="compact-xs"
              color="orange"
              onClick={() => reverseMutation.mutate(entryId)}
              loading={reverseMutation.isPending}
            >
              Reverse
            </Button>
          )}
        </Group>
      );
    },
  };

  return (
    <DataPageShell
      config={{
        ...journalEntriesConfig,
        columns: [...columns, actionColumn],
      }}
    />
  );
}
