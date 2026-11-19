/**
 * Single source for the tenant context sent to every backend:
 *   X-Organization-Id: omitted = all organisations (super admin),
 *                      'global' = null-org/global rows,
 *                      <uuid>  = that organisation.
 *   X-Location-Id:     omitted = all locations, otherwise the selected location.
 *
 * The value is kept in module state (set by <TenantHeaderSync/>) rather than
 * read from the Zustand stores inside the axios interceptor, which would create
 * an import cycle with the auth store.
 */
export type TenantHeaders = {
  organizationId?: string;
  locationId?: string;
};

let current: TenantHeaders = {};

export function setTenantHeaders(next: TenantHeaders): void {
  current = { ...next };
}

export function getTenantHeaders(): TenantHeaders {
  return current;
}

/**
 * `undefined` = "All organisations" (omit the header), `null` = "Global"
 * (only null-org rows), a string = that organisation id.
 */
export function organizationHeaderValue(selected: string | null | undefined): string | undefined {
  if (selected === undefined) return undefined;
  if (selected === null) return 'global';
  return selected;
}
