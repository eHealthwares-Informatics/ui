import type { ModuleId } from '@/features/shared/module-data';
import { getModuleDashboard } from '@/lib/module-routing';

/**
 * Where to send the user right after a successful login:
 *  - an explicit `?redirect=` wins (normalized to a path when a full URL),
 *  - a single available module skips the chooser and lands on its dashboard,
 *  - otherwise the module landing grid, where the user picks their module.
 *
 * `moduleIds` are the ids from /auth/me's permission-derived `modules` list.
 */
export function resolvePostLoginTarget(
  redirectTo: string | undefined,
  moduleIds: string[]
): string {
  if (redirectTo) {
    let target = redirectTo;
    try {
      if (target.startsWith('http')) {
        const parsed = new URL(target);
        target = parsed.pathname + parsed.search;
      }
    } catch {
      /* not a valid absolute URL — use as-is */
    }
    return target.startsWith('/') ? target : `/${target}`;
  }

  if (moduleIds.length === 1) {
    return getModuleDashboard(moduleIds[0] as ModuleId);
  }

  return '/modules';
}
