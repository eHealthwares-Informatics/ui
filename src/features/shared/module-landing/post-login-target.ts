import type { ModuleId } from '@/features/shared/module-data';
import { getModuleDashboard } from '@/lib/module-routing';
import { readSelectedModuleId } from '@/lib/module-storage';

/**
 * Where to send the user right after a successful login:
 *  - an explicit `?redirect=` wins (normalized to a path when a full URL),
 *  - the module they last selected, when they still have access to it,
 *  - a single available module skips the chooser and lands on its dashboard,
 *  - otherwise the module landing grid, where the user picks their module.
 *
 * `moduleIds` are the ids from /auth/me's permission-derived `modules` list.
 * `rememberedModuleId` defaults to the module persisted in localStorage (see
 * `lib/module-storage`); tests pass it explicitly to stay deterministic.
 */
export function resolvePostLoginTarget(
  redirectTo: string | undefined,
  moduleIds: string[],
  rememberedModuleId: string | null = readSelectedModuleId()
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

  // A remembered module only wins when the user still has access to it — a
  // different user on the same browser must never inherit someone else's
  // selection.
  if (rememberedModuleId && moduleIds.includes(rememberedModuleId)) {
    return getModuleDashboard(rememberedModuleId as ModuleId);
  }

  if (moduleIds.length === 1) {
    return getModuleDashboard(moduleIds[0] as ModuleId);
  }

  return '/modules';
}
