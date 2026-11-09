import { Stack } from '@mantine/core';
import { useMemo } from 'react';
import { DataPageShell } from '@/components/page/data-page-shell';
import { useAuthStore } from '@/stores/auth-store';
import { buildBillingChargesConfig } from './schema';

export function RxBillingChargesPage() {
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
      buildBillingChargesConfig({
        organizationId,
        scopeKey,
        scopeParams,
      }),
    [organizationId, scopeKey, scopeParams]
  );

  return (
    <Stack gap="lg">
      <DataPageShell key={scopeKey} config={config} />
    </Stack>
  );
}
