import { useAuthStore } from '@/stores/auth-store';

/**
 * Wildcard permission-code matcher — the exact semantics the backends use
 * (rxsoft/src/common/utils/permission-matcher.ts), so the UI never hides
 * something the API would allow or shows something the API would 403.
 *
 * A user permission matches a required code when every dot-segment matches,
 * with `*` wildcards: `rxsoft.*` covers `rxsoft.catalog.item.read`,
 * `rxsoft.catalog.*` covers any catalog code, `*` covers everything.
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

  return userParts.length === requiredParts.length;
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
