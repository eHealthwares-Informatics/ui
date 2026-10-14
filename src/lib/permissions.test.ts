import { describe, expect, it } from 'vitest';
import { hasPermission, permissionMatches } from './permissions';

/**
 * The UI matcher MUST mirror the backend matcher semantics exactly
 * (rxsoft/src/common/utils/permission-matcher.ts) — never hide something the
 * API would allow, never show something the API would 403.
 */
describe('permissionMatches', () => {
  it('matches exact codes', () => {
    expect(permissionMatches('rxsoft.catalog.item.read', 'rxsoft.catalog.item.read')).toBe(true);
  });

  it('mismatched codes do not match', () => {
    expect(permissionMatches('rxsoft.catalog.item.create', 'rxsoft.catalog.item.read')).toBe(false);
  });

  it('trailing wildcard covers the whole namespace', () => {
    expect(permissionMatches('rxsoft.*', 'rxsoft.catalog.item.read')).toBe(true);
    expect(permissionMatches('rxsoft.catalog.*', 'rxsoft.catalog.item.delete')).toBe(true);
  });

  it('mid-namespace wildcard matches positionally (same backend semantics)', () => {
    // Same depth: 'rxsoft.*.read' matches 'rxsoft.<x>.read'...
    expect(permissionMatches('rxsoft.*.read', 'rxsoft.catalog.read')).toBe(true);
    // ...but NOT deeper codes — the segments after the wildcard must align.
    expect(permissionMatches('rxsoft.*.read', 'rxsoft.catalog.item.read')).toBe(false);
    expect(permissionMatches('rxsoft.*.read', 'rxsoft.catalog.item.create')).toBe(false);
  });

  it('global wildcard covers everything', () => {
    expect(permissionMatches('*', 'lis.order.read')).toBe(true);
  });

  it('a longer user permission than the required code does not match', () => {
    expect(permissionMatches('rxsoft.catalog.item.read.extra', 'rxsoft.catalog.item.read')).toBe(
      false
    );
  });

  it('a shorter user permission than the required code does not match', () => {
    expect(permissionMatches('rxsoft.catalog', 'rxsoft.catalog.item.read')).toBe(false);
  });
});

describe('hasPermission', () => {
  const adminPerms = ['rxsoft.*', 'lis.*'];
  const cashierPerms = ['rxsoft.catalog.item.read', 'rxsoft.sales.sale.read'];

  it('satisfies a required code via a wildcard grant', () => {
    expect(hasPermission(adminPerms, 'rxsoft.identity.user.read')).toBe(true);
  });

  it('satisfies a required code held exactly', () => {
    expect(hasPermission(cashierPerms, 'rxsoft.catalog.item.read')).toBe(true);
  });

  it('blocks a required code the user does not hold', () => {
    expect(hasPermission(cashierPerms, 'rxsoft.identity.role.read')).toBe(false);
  });

  it('an empty permission list never matches', () => {
    expect(hasPermission([], 'rxsoft.catalog.item.read')).toBe(false);
  });
});
