import type { RowAction } from '@/features/shared/model-schema';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Wildcard permission-code matcher — the exact semantics the backends use
 * (rxsoft/src/common/utils/permission-matcher.ts), so the UI never hides
 * something the API would allow or shows something the API would 403.
 *
 * A user permission matches a required code when every dot-segment matches.
 * Two wildcard forms are understood:
 *
 *   - **Parent grant (preferred).** A *prefix* grant covers its whole subtree:
 *     `rxsoft.catalog` covers `rxsoft.catalog.item.read`, `…item.create`, and so
 *     on. The module/parent code IS the default wildcard — you do not append
 *     `.*`.
 *   - **Explicit `*` segments (legacy).** `rxsoft.*` covers any single-segment
 *     suffix, `rxsoft.catalog.*` covers everything under `catalog`, and a bare
 *     `*` covers everything. Kept for backward compatibility; new grants should
 *     use the parent form.
 */
export function permissionMatches(userPerm: string, requiredCode: string): boolean {
  if (userPerm === '*') return true;

  const userParts = userPerm.split('.');
  const requiredParts = requiredCode.split('.');

  for (let i = 0; i < userParts.length; i++) {
    if (userParts[i] === '*') {
      if (i === userParts.length - 1) return true;
      continue;
    }
    if (i >= requiredParts.length) return false;
    if (userParts[i] !== requiredParts[i]) return false;
  }

  // Every granted segment matched positionally, so the grant is a prefix of the
  // required code — a parent grant covering its subtree. (Previously this
  // required equal lengths, which is why `rxsoft.catalog` could not cover
  // `rxsoft.catalog.item.read` and only the `.*` form worked.)
  return true;
}

/** True when the user holds any permission satisfying `required` (wildcards apply). */
export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.some((userPerm) => permissionMatches(userPerm, required));
}

/**
 * Access-control enforcement ladder (phased rollout — see the access-control
 * plan ticket). Each level hides a coarser slice of the UI than the next:
 *
 *   ROLE    — module hidden (TeamSwitcher + module landing grid; driven by
 *             identity's getUserModules permission-prefix match)
 *   MENU    — sidebar nav GROUP hidden when the group's `permission` is absent
 *   SUBMENU — nav ITEM hidden when the item's `permission` is absent
 *   ACTIONS — buttons/links hidden inside pages (phase 2; useHasPermission)
 */
export const ACCESS_ENFORCEMENT_LEVELS = ['ROLE', 'MENU', 'SUBMENU', 'ACTIONS'] as const;
export type AccessEnforcementLevel = (typeof ACCESS_ENFORCEMENT_LEVELS)[number];

/** React hook for ACTIONS-level gating (buttons, links) — phase 2+ pages. */
export function useHasPermission(required: string): boolean {
  const userPermissions = useAuthStore((state) => state.user?.permissions ?? []);
  return hasPermission(userPermissions, required);
}

/**
 * True when `code` is unset (untagged action → unchanged) or the user holds it.
 * Used to gate a page's actions from its `permissions` action map.
 */
export function permits(userPermissions: string[], code?: string): boolean {
  return !code || hasPermission(userPermissions, code);
}

/**
 * Drops row actions whose catalog code (looked up by `RowAction.id`) the user
 * does not hold. Actions with no id, or ids absent from the map, are kept, so
 * partially-tagged pages degrade to "still visible" rather than "disappeared".
 */
export function gateRowActions(
  rowActions: RowAction[] | undefined,
  codes: Record<string, string> | undefined,
  userPermissions: string[]
): RowAction[] | undefined {
  if (!rowActions || !codes) return rowActions;
  return rowActions.filter((action) =>
    permits(userPermissions, action.id ? codes[action.id] : undefined)
  );
}
