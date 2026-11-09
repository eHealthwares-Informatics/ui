import { Stack } from '@mantine/core';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { useAuthStore } from '@/stores/auth-store';
import { buildNotificationTemplatesConfig } from './schema';

export function RxNotificationTemplatesPage() {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  // The header organisation filter drives the scope for every role; the backend
  // pins non-superadmins to their own organisation.
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const organizationId = selectedOrganisationId ?? null;
  // Tri-state scope sent to the API: undefined → all organisations,
  // null → global defaults only, id → that organisation.
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

  const config = useMemo(
    () =>
      buildNotificationTemplatesConfig({
        organizationId,
        scopeKey,
        scopeParams,
        canManageGlobal: isSuperAdmin,
      }),
    [organizationId, scopeKey, scopeParams, isSuperAdmin]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
