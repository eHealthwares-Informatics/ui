import { useQuery } from '@tanstack/react-query';
import { useModuleId } from '@/context/module-context';
import type { ModuleId } from '@/features/shared/module-data';
import { emrApi } from '@/lib/emr-api';
import { identityApi } from '@/lib/identity-api';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { useAuthStore } from '@/stores/auth-store';

/** A location as the header switcher needs it: an id plus the two display lines. */
export type ScopeLocation = {
  id: string;
  code: string | null;
  name: string;
  /** Identity location id this record maps to (stock locations only). */
  identityLocationId?: string | null;
};

export type LocationScope = {
  /** Storage key for the picked location (see `location-store`). */
  key: 'stock' | 'site';
  /** What this module calls a location, e.g. "Stock location". */
  label: string;
  /** Whether the signed-in user's own location is a sensible default. */
  followsAccountLocation: boolean;
  /** One-line hint under the menu heading. */
  hint: string;
};

/** Stock locations that are working sites — partners/scrap are not pickable. */
const NON_SITE_TYPES = new Set(['supplier', 'customer', 'scrap', 'transit']);

type StockLocationRow = {
  id: string;
  code?: string | null;
  name: string;
  locationType?: string | null;
  isActive?: boolean;
  locationId?: string | null;
};

async function fetchStockLocations(): Promise<ScopeLocation[]> {
  const res = await rxsoftApi.get<{ data: StockLocationRow[] }>('/stock-locations', {
    params: { limit: 200, isActive: true },
  });
  return (res.data?.data ?? [])
    .filter((row) => !row.locationType || !NON_SITE_TYPES.has(row.locationType))
    .map((row) => ({
      id: row.id,
      code: row.code ?? null,
      name: row.name,
      identityLocationId: row.locationId ?? null,
    }));
}

async function fetchEmrLocations(): Promise<ScopeLocation[]> {
  const res = await emrApi.get<{ data: ScopeLocation[] }>('/locations', {
    params: { limit: 100 },
  });
  return res.data?.data ?? [];
}

async function fetchIdentityLocations(): Promise<ScopeLocation[]> {
  const res = await identityApi.get<{ data: ScopeLocation[] }>('/locations', {
    params: { limit: 100 },
  });
  return res.data?.data ?? [];
}

/**
 * Which set of locations a module works in. Modules without a location concept
 * (messaging, terminology, lab) return `null` and the header hides the
 * switcher instead of showing a control that cannot do anything.
 */
export function locationScopeForModule(moduleId: ModuleId): LocationScope | null {
  switch (moduleId) {
    // Pharmacy operations happen at a stock location (warehouse/shelf), not at
    // an identity site, so the switcher lists the RxSoft stock locations.
    case 'rxsoft':
    case 'website':
      return {
        key: 'stock',
        label: 'Stock location',
        followsAccountLocation: false,
        hint: 'Stock locations',
      };
    case 'emr':
      return {
        key: 'site',
        label: 'Location',
        followsAccountLocation: true,
        hint: 'Clinical locations',
      };
    case 'admin':
    case 'identity':
      return {
        key: 'site',
        label: 'Location',
        followsAccountLocation: true,
        hint: 'Organisation locations',
      };
    default:
      return null;
  }
}

function fetcherFor(moduleId: ModuleId): (() => Promise<ScopeLocation[]>) | null {
  switch (moduleId) {
    case 'rxsoft':
    case 'website':
      return fetchStockLocations;
    case 'emr':
      return fetchEmrLocations;
    case 'admin':
    case 'identity':
      return fetchIdentityLocations;
    default:
      return null;
  }
}

/**
 * The location endpoints are role-gated, not permission-gated:
 *  - rxsoft `/stock-locations`: admin | super_admin | pharmacist | cashier | inventory_clerk
 *  - identity `/locations`:     admin | super_admin
 *  - emr `/locations`:          unguarded (identity proxy)
 *
 * Demo/module-scoped roles (`rxsoft_admin`, `website_admin`, `identity_admin`, …)
 * do NOT satisfy those role guards, so rendering the control for them caused a
 * background 403 → global /403 redirect. Hide it unless the signed-in user can
 * actually read the list.
 */
function canUseLocationScope(moduleId: ModuleId, roles: string[]): boolean {
  if (roles.includes('super_admin')) {
    return true;
  }
  if (moduleId === 'emr') {
    return true;
  }
  if (moduleId === 'rxsoft' || moduleId === 'website') {
    return ['admin', 'pharmacist', 'cashier', 'inventory_clerk'].some((role) =>
      roles.includes(role)
    );
  }
  if (moduleId === 'admin' || moduleId === 'identity') {
    return roles.includes('admin');
  }
  return false;
}

/** Stable empty array so Zustand selectors don't return a fresh reference each render. */
const EMPTY_ROLES: string[] = [];

/** Locations available to the active module, already normalised for the switcher. */
export function useModuleLocations() {
  const moduleId = useModuleId();
  const roles = useAuthStore((state) => state.user?.roles) ?? EMPTY_ROLES;
  const allowed = canUseLocationScope(moduleId, roles);
  const scope = allowed ? locationScopeForModule(moduleId) : null;
  const fetcher = allowed ? fetcherFor(moduleId) : null;
  const accountLocationId = useAuthStore((state) => state.user?.locationId ?? null);

  const query = useQuery({
    queryKey: ['header', 'locations', scope?.key ?? 'none', moduleId],
    queryFn: () => (fetcher ? fetcher() : Promise.resolve<ScopeLocation[]>([])),
    enabled: Boolean(scope && fetcher),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const locations = query.data ?? [];

  // Default the working location to the signed-in user's location. For site
  // scopes the ids match directly; for stock locations we resolve the one whose
  // identity location is the user's location.
  const defaultLocationId = scope?.followsAccountLocation
    ? accountLocationId
    : scope?.key === 'stock'
      ? (locations.find(
          (location) =>
            location.identityLocationId && location.identityLocationId === accountLocationId
        )?.id ?? null)
      : null;

  return {
    scope,
    locations,
    isLoading: query.isLoading,
    defaultLocationId,
  };
}
