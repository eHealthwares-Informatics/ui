import { useEffect } from 'react';
import { organizationHeaderValue, setTenantHeaders } from '@/lib/tenant-headers';
import { useAuthStore } from '@/stores/auth-store';
import { useActiveLocationId } from './location-store';
import { useModuleLocations } from './use-module-locations';

/**
 * Keeps the tenant headers used by the API client in sync with the header
 * selectors. Rendered once inside the app header.
 *
 * - organisation: undefined = all, null = global, id = that organisation
 * - location: the effective location for the active module (user default or picked)
 */
export function TenantHeaderSync() {
  const selectedOrganisationId = useAuthStore((state) => state.selectedOrganisationId);
  const { scope, defaultLocationId } = useModuleLocations();
  const scopeKey = scope?.key ?? 'none';
  const activeLocationId = useActiveLocationId(scopeKey, defaultLocationId);

  useEffect(() => {
    setTenantHeaders({
      organizationId: organizationHeaderValue(selectedOrganisationId),
      locationId: activeLocationId ?? undefined,
    });
  }, [selectedOrganisationId, activeLocationId]);

  return null;
}
