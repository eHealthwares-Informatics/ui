import { Card, Select, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import { identityApi } from '@/lib/identity-api';
import { useAuthStore } from '@/stores/auth-store';
import { buildNotificationTemplatesConfig } from './schema';

type OrgOption = { id: string; name: string; code?: string };

export function RxNotificationTemplatesPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;

  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const { data: organizations = [], isLoading: loadingOrganizations } = useQuery({
    queryKey: ['notification-templates', 'organizations'],
    enabled: isSuperAdmin,
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await identityApi.get('/organizations', { params: { limit: 200 } });
      return (data?.data ?? data ?? []) as OrgOption[];
    },
  });

  useEffect(() => {
    if (isSuperAdmin && !organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [isSuperAdmin, organizationId, organizations]);

  const canLoad = !isSuperAdmin || Boolean(organizationId);

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.code ? `${org.code} - ${org.name}` : org.name,
      })),
    [organizations]
  );

  const config = useMemo(
    () =>
      buildNotificationTemplatesConfig({
        organizationId: isSuperAdmin ? organizationId : null,
        canManageGlobal: isSuperAdmin,
      }),
    [isSuperAdmin, organizationId]
  );

  return (
    <Stack gap="lg">
      {isSuperAdmin && (
        <Card withBorder radius="md" padding="lg">
          <Select
            label="Facility (organisation)"
            placeholder={loadingOrganizations ? 'Loading organisations…' : 'Select an organisation'}
            data={organizationOptions}
            value={organizationId}
            onChange={(value) => setOrganizationId(value ?? null)}
            searchable
            clearable
            disabled={loadingOrganizations}
            nothingFoundMessage="No organisations found"
          />
        </Card>
      )}

      {!canLoad ? (
        <Text c="dimmed" ta="center" py="xl">
          Select an organisation to view its notification templates.
        </Text>
      ) : (
        <DataPageShell key={organizationId ?? 'global'} config={config} />
      )}
    </Stack>
  );
}
