import { notifications as toast } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { buildNotificationDispatchesConfig, NOTIFICATION_DISPATCHES_QUERY_KEY } from './schema';

/**
 * RxSoft notification dispatch ledger — every event RxSoft sent through the
 * conversation engine, with a per-row Retrigger button.
 */
export function RxsoftNotificationDispatchesPage() {
  const queryClient = useQueryClient();

  const handleRetrigger = useCallback(
    async (row: Record<string, unknown>) => {
      const id = String(row.id ?? '');
      if (!id) {
        return;
      }
      try {
        const { data } = await rxsoftApi.post(`/notifications/dispatches/${id}/retrigger`);
        toast.show({
          message: data?.ok
            ? `Notification re-sent (${data.sent} delivered)`
            : 'Retrigger attempted — no channel accepted the message',
          color: data?.ok ? 'green' : 'yellow',
        });
        await queryClient.invalidateQueries({ queryKey: NOTIFICATION_DISPATCHES_QUERY_KEY });
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to retrigger notification';
        toast.show({ message, color: 'red' });
      }
    },
    [queryClient]
  );

  const config = useMemo(
    () => buildNotificationDispatchesConfig({ onRetrigger: handleRetrigger }),
    [handleRetrigger]
  );

  return <DataPageShell config={config} />;
}
