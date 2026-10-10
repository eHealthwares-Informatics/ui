import { Box, Group, Text, Badge } from '@mantine/core';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { notifications as toast } from '@mantine/notifications';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { lisApi } from '@/lib/lis-api';
import { notificationsConfig } from './schema';

export function LisNotificationsPage() {
  const [syncing, setSyncing] = useState(false);

  async function syncDeliveryStatus() {
    setSyncing(true);
    try {
      await lisApi.post('/lis/notifications/sync-delivery');
      toast.show({ message: 'Delivery statuses pulled from the conversations module', color: 'green' });
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
          Messages are sent via the conversations module; this ledger is the LIS copy of every
          send with its delivery status.
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
      <DataPageShell config={notificationsConfig} />
    </Box>
  );
}
