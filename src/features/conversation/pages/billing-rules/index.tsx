import { Stack } from '@mantine/core';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { useAuthStore } from '@/stores/auth-store';
import { buildBillingRulesConfig } from './schema';

export function RxBillingRulesPage() {
  const user = useAuthStore((state) => state.user);
  const canManageGlobal = user?.roles?.includes('super_admin') ?? false;
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

  const config = useMemo(
    () =>
      buildBillingRulesConfig({
        organizationId,
        scopeKey,
        scopeParams,
        canManageGlobal,
      }),
    [organizationId, scopeKey, scopeParams, canManageGlobal]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
