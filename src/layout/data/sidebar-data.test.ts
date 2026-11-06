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

const adminOnlyGroup: NavItem = {
  title: 'Admin Only',
  icon: undefined,
  modules: ['admin'],
  items: [{ title: 'Admin Item', icon: undefined, modules: ['admin'] }],
} as NavItem;

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
    const valid = /^(rxsoft|lis|emr|conversation|communication|coding-concept|shop)\.[a-z0-9.*-]+$/;
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

  it('hides an admin-scoped group outside the admin module', () => {
    const hidden = filterNavGroupsByModule([adminOnlyGroup], 'rxsoft', ['*']);
    expect(hidden).toHaveLength(0);

    const visible = filterNavGroupsByModule([adminOnlyGroup], 'admin', ['*']);
    expect(visible).toHaveLength(1);
    expect(visible[0].title).toBe('Admin Only');
  });
});

describe('sidebarData — consolidated admin menus', () => {
  it('has no duplicate group titles', () => {
    const titles = sidebarData.navGroups.map((group) => group.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('shows only Notifications and Configuration menus in the admin module', () => {
    const groups = filterNavGroupsByModule(sidebarData.navGroups, 'admin', ['*']);

    expect(groups.map((group) => group.title)).toEqual([
      'Notifications',
      'Configuration',
      'LIS Configuration',
      'EMR Configuration',
    ]);
  });

  it('puts notification templates under Notifications', () => {
    const notifications = sidebarData.navGroups.find((group) => group.title === 'Notifications');
    expect(notifications).toBeDefined();
    expect(notifications?.modules).toEqual(['conversation', 'admin']);

    const titles = (notifications?.items ?? []).map((item) => item.title);
    expect(titles).toEqual([
      'Notification Templates',
      'Notification Events',
      'Print Templates',
      'Notification Delivery',
    ]);

    const byTitle = Object.fromEntries(
      (notifications?.items ?? []).map((item) => [item.title, item])
    );

    expect(byTitle['Notification Templates'].url).toBe('/conversation/notification-templates');
    expect(byTitle['Notification Events'].url).toBe('/conversation/notification-events');
    expect(byTitle['Notification Delivery'].url).toBe('/conversation/notification-delivery');
    expect(byTitle['Print Templates'].url).toBe('/rxsoft/print-templates');
    expect(byTitle['Print Templates'].modules).toEqual(['admin']);
  });

  it('keeps Configuration, LIS Configuration and EMR Configuration as separate admin groups', () => {
    const configurationGroups = sidebarData.navGroups.filter((group) =>
      ['Configuration', 'LIS Configuration', 'EMR Configuration'].includes(group.title)
    );

    expect(configurationGroups.map((group) => group.title)).toEqual([
      'Configuration',
      'LIS Configuration',
      'EMR Configuration',
    ]);
    expect(configurationGroups.every((group) => group.modules?.includes('admin'))).toBe(true);
  });

  it('does not leave template entries in the old module menus', () => {
    const allItems = sidebarData.navGroups.flatMap((group) => group.items ?? []);
    const templateItems = allItems.filter((item) => /templates?/i.test(item.title));

    expect(templateItems.map((item) => item.title).sort()).toEqual([
      'Notification Templates',
      'Print Templates',
    ]);
  });
});
