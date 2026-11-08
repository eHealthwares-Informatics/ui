import { Box, Group, Text, Badge } from '@mantine/core';
import { notifications as toast } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { lisApi } from '@/lib/lis-api';
import { buildNotificationsConfig } from './schema';

const QUERY_KEY_BASE = ['rxsoft-data-page', '/lis/notifications/dispatches'];

export function LisNotificationsPage() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [retriggeringId, setRetriggeringId] = useState<string | null>(null);

  const retrigger = useCallback(
    async (row: Record<string, unknown>) => {
      const id = String(row.id ?? '');
      if (!id) {
        return;
      }
      setRetriggeringId(id);
      try {
        const { data } = await lisApi.post(
          `/lis/notifications/dispatches/${id}/retrigger`,
        );
        toast.show({
          message: data?.ok
            ? 'Notification re-sent'
            : 'Retrigger attempted — no channel accepted the message',
          color: data?.ok ? 'green' : 'yellow',
        });
        await queryClient.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      } catch (error: any) {
        toast.show({
          message:
            error?.response?.data?.message ??
            'Failed to retrigger notification',
          color: 'red',
        });
      } finally {
        setRetriggeringId(null);
      }
    },
    [queryClient],
  );

  const config = useMemo(
    () => buildNotificationsConfig({ onRetrigger: retrigger }),
    [retrigger],
  );

  async function syncDeliveryStatus() {
    setSyncing(true);
    try {
      await lisApi.post('/lis/notifications/sync-delivery');
      toast.show({
        message: 'Delivery statuses pulled from the conversations module',
        color: 'green',
      });
      window.location.reload();
    } catch (error: any) {
      toast.show({
        message: error?.response?.data?.message ?? 'Failed to sync delivery statuses',
        color: 'red',
      });
      setSyncing(false);
    }
  }

  return (
    <Box>
      <Group justify="space-between" mb="sm" px="md">
        <Text size="sm" c="dimmed">
          Messages are sent via the conversations module; this ledger is the LIS copy of every send
          with its delivery status.
        </Text>
        <Badge
          leftSection={<RefreshCw size={12} />}
          variant="light"
          color={syncing ? 'grape' : 'blue'}
          style={{ cursor: 'pointer' }}
          onClick={() => !syncing && syncDeliveryStatus()}
        >
          {syncing ? 'Syncing…' : 'Sync delivery status'}
        </Badge>
      </Group>
      {retriggeringId && (
        <Text size="xs" c="dimmed" px="md" mb={4}>
          Re-sending notification {retriggeringId.slice(0, 8)}…
        </Text>
      )}
      <DataPageShell config={config} />
    </Box>
  );
}
