import { Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';
import { buildNotificationEventsConfig, type PrintTemplateRow } from './schema';

export function RxNotificationEventsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  // The header organisation filter drives the scope for every role; the
  // backend pins non-superadmins to their own organisation.
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;
  const scopeParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (selectedOrganisationId === null) {
      params.organizationId = 'null';
    } else if (selectedOrganisationId) {
      params.organizationId = selectedOrganisationId;
    }
    return params;
  }, [selectedOrganisationId]);
  const scopeKey =
    selectedOrganisationId === undefined ? 'all' : (selectedOrganisationId ?? 'global');

  const { data: printTemplates = [] } = useQuery({
    queryKey: ['notification-events', 'print-templates'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/templates', {
        params: { type: 'print', isActive: 'true', limit: 200 },
      });
      const rows = getArrayPayload(data) as PrintTemplateRow[];
      // Defensive: only surface print templates even if the API returns a
      // mixed list (older builds ignored the `type` filter).
      return rows.filter((row) => !row.type || row.type === 'print');
    },
  });

  const eventMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      await conversationApi.patch(`/notification-events/${id}`, {
        ...payload,
        ...(organizationId ? { organizationId } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-events'] });
    },
    onError: (error) => notifications.show({ color: 'red', message: getApiErrorMessage(error) }),
  });

  const config = useMemo(
    () =>
      buildNotificationEventsConfig({
        organizationId,
        scopeKey,
        scopeParams,
        printTemplates,
        isSuperAdmin,
        eventMutation,
      }),
    [organizationId, scopeKey, scopeParams, printTemplates, isSuperAdmin, eventMutation]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
