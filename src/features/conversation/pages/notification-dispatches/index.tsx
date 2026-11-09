import { Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { getArrayPayload } from '@/components/utils';
import { conversationApi } from '@/lib/conversation-api';
import { useAuthStore } from '@/stores/auth-store';
import {
  buildNotificationDispatchesConfig,
  type DispatchChannelRow,
  type DispatchEventRow,
  type DispatchTemplateRow,
} from './schema';

export function RxNotificationDispatchesPage() {
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  // The header organisation filter drives the scope for every role; the
  // backend pins non-superadmins to their own organisation.
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

  const { data: events = [] } = useQuery({
    queryKey: ['notification-dispatches', 'events', scopeKey],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-events', {
        params: { ...scopeParams },
      });
      return getArrayPayload(data) as DispatchEventRow[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['notification-dispatches', 'templates', scopeKey],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-templates', {
        params: { ...scopeParams },
      });
      return getArrayPayload(data) as DispatchTemplateRow[];
    },
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['notification-dispatches', 'channels'],
    queryFn: async () => {
      const { data } = await conversationApi.get('/notification-channels');
      return getArrayPayload(data) as DispatchChannelRow[];
    },
  });

  const config = useMemo(
    () =>
      buildNotificationDispatchesConfig({
        organizationId,
        scopeKey,
        scopeParams,
        events,
        templates,
        channels,
      }),
    [organizationId, scopeKey, scopeParams, events, templates, channels]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
