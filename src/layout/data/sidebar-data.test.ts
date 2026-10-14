import { describe, expect, it } from 'vitest';
import type { NavItem } from '../types';
import { filterNavGroupsByModule, sidebarData } from './sidebar-data';

/**
 * Phase 1 of the access-control plan — MENU (nav group) + SUBMENU (nav item)
 * enforcement. Entries tagged `permission` are hidden unless the user's token
 * permissions satisfy the code (wildcards apply, matcher mirrors the
 * backends). Untagged entries remain visible — the backend guard is still
 * the real enforcement.
 */

const group = (permission: string | undefined, items: NavItem[]): NavItem =>
  ({
    title: 'Test Group',
    icon: undefined,
    ...(permission ? { permission } : {}),
    items,
  }) as NavItem;

const item = (title: string, permission?: string | string[]): NavItem =>
  ({
    title,
    icon: undefined,
    modules: ['rxsoft'],
    ...(permission ? { permission } : {}),
  }) as NavItem;

const tagged = item('Tagged', 'rxsoft.identity.role.read');
const anyOf = item('AnyOf', ['rxsoft.reports.sales.view', 'rxsoft.reports.inventory.view']);
const untagged = item('Untagged');
const lisOnly = { title: 'LisOnly', icon: undefined, modules: ['lis'] } as NavItem;

const navGroups = [
  group(undefined, [tagged, anyOf, untagged, lisOnly]),
  group('rxsoft.identity.user.read', [item('Child')]),
];

describe('filterNavGroupsByModule — permission gating (MENU + SUBMENU)', () => {
  it('hides tagged items the user lacks, keeps untagged items visible', () => {
    const [g1, g2] = filterNavGroupsByModule(navGroups, 'rxsoft', [
      'rxsoft.reports.inventory.view',
    ]);

    // Tagged single-code item hidden (no role.read); any-of item visible via
    // the inventory-reports alternative; untagged always visible.
    expect((g1?.items ?? []).map((i) => i.title)).toEqual(['AnyOf', 'Untagged']);
    // Group gated on user.read: the caller lacks it -> whole group hidden.
    expect(g2).toBeUndefined();
  });

  it('wildcard permissions satisfy tagged items and groups (admin-style grant)', () => {
    const [g1, g2] = filterNavGroupsByModule(navGroups, 'rxsoft', ['rxsoft.*']);

    expect((g1?.items ?? []).map((i) => i.title)).toEqual(['Tagged', 'AnyOf', 'Untagged']);
    expect((g2?.items ?? []).map((i) => i.title)).toEqual(['Child']);
  });

  it('a group whose items are all permission-hidden disappears', () => {
    const groups = [group(undefined, [tagged])];
    expect(filterNavGroupsByModule(groups, 'rxsoft', [])).toHaveLength(0);
  });

  it('module filtering still applies alongside permission gating', () => {
    const [g1] = filterNavGroupsByModule(navGroups, 'lis', []);
    // rxsoft-tagged items are hidden under the 'lis' module; the lis-only
    // item survives, and permission gating must not resurrect module gating.
    expect((g1?.items ?? []).map((i) => i.title)).toEqual(['LisOnly']);
  });

  it('every sidebar entry carries either no permission or a catalog-shaped code', () => {
    // Guard against tag drift: permissions must be dot-namespaced catalog
    // codes, never role names or free text.
    const valid = /^(rxsoft|lis|emr|conversation|communication|coding-concept)\.[a-z0-9.*-]+$/;
    const check = (entry: NavItem) => {
      const required = Array.isArray(entry.permission) ? entry.permission : [entry.permission];
      for (const code of required.filter(Boolean)) {
        expect(code, `bad permission tag: ${code}`).toMatch(valid);
      }
    };
    for (const navGroup of sidebarData.navGroups) {
      check(navGroup);
      (navGroup.items ?? []).forEach(check);
    }
  });
});
