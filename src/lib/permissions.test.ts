import { describe, expect, it } from 'vitest';
import { gateRowActions, hasPermission, permissionMatches, permits } from './permissions';

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

  it('a parent grant covers its whole subtree (the default wildcard)', () => {
    expect(permissionMatches('rxsoft.catalog', 'rxsoft.catalog.item.read')).toBe(true);
    expect(permissionMatches('rxsoft.catalog', 'rxsoft.catalog.item.delete')).toBe(true);
    expect(permissionMatches('rxsoft.catalog', 'rxsoft.catalog')).toBe(true);
    expect(permissionMatches('rxsoft', 'rxsoft.catalog.item.read')).toBe(true);
  });

  it('a parent grant does not leak sideways or to unrelated namespaces', () => {
    expect(permissionMatches('rxsoft.catalog', 'rxsoft.sales.sale.read')).toBe(false);
    expect(permissionMatches('rxsoft.catalog', 'lis.order.read')).toBe(false);
    expect(permissionMatches('rxsoft.catalog.item', 'rxsoft.catalog.itemX.read')).toBe(false);
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

/**
 * ACTIONS-level gating (access-control ladder, phase 2). An absent code must
 * always leave an action visible — untagged pages must not regress.
 */
describe('permits', () => {
  const perms = ['rxsoft.catalog.item.read', 'rxsoft.catalog.item.create'];

  it('allows an action with no code (untagged → unchanged)', () => {
    expect(permits(perms, undefined)).toBe(true);
    expect(permits([], undefined)).toBe(true);
  });

  it('allows an action whose code the user holds', () => {
    expect(permits(perms, 'rxsoft.catalog.item.create')).toBe(true);
  });

  it('hides an action whose code the user lacks', () => {
    expect(permits(perms, 'rxsoft.catalog.item.delete')).toBe(false);
  });

  it('honours wildcards', () => {
    expect(permits(['rxsoft.catalog.*'], 'rxsoft.catalog.item.delete')).toBe(true);
  });
});

describe('gateRowActions', () => {
  const actions = [
    { id: 'print', label: 'Print' },
    { id: 'archive', label: 'Archive' },
    { id: 'unkeyed', label: 'Untagged' },
  ];

  it('keeps everything when there is no code map', () => {
    expect(gateRowActions(actions, undefined, [])).toBe(actions);
  });

  it('keeps everything when there are no row actions', () => {
    expect(gateRowActions(undefined, { print: 'x.y.z' }, [])).toBeUndefined();
  });

  it('keeps an action whose code the user holds', () => {
    const gated = gateRowActions(actions, { print: 'rxsoft.catalog.item.read' }, [
      'rxsoft.catalog.item.read',
    ]);
    expect(gated?.map((a) => a.id)).toEqual(['print', 'archive', 'unkeyed']);
  });

  it('drops an action whose code the user lacks, keeping untagged ones', () => {
    const gated = gateRowActions(actions, { print: 'rxsoft.catalog.item.read' }, []);
    // `print` is dropped; `archive`/`unkeyed` carry no code → left visible.
    expect(gated?.map((a) => a.id)).toEqual(['archive', 'unkeyed']);
  });

  it('never mutates the source list', () => {
    gateRowActions(actions, { print: 'rxsoft.catalog.item.read' }, []);
    expect(actions).toHaveLength(3);
  });
});
