import { permissionMatches } from '@/lib/permissions';
import { modules as frontendModules } from './module-data';

/** True when a permission root is granted, in either direction:
 *  the grant covers the root (`rxsoft.*`), or sits inside it
 *  (`rxsoft.website.content.read`). */
function isRootGranted(userPermissions: string[], root: string): boolean {
  return userPermissions.some(
    (perm) => permissionMatches(perm, root) || permissionMatches(root, perm)
  );
}

/** Minimal module shape returned by identity `GET /auth/me`. */
export type BackendModule = {
  id: string;
  name: string;
  description: string;
  root: string;
};

/**
 * Expands the backend's module list with frontend-only modules that are
 * children of a granted backend module.
 *
 * Identity derives modules from permission roots (`rxsoft.*` → `rxsoft`), but
 * some frontend modules are served by another module's API and only have a
 * namespace under it. The Website Console calls the RxSoft API and its
 * permissions are `rxsoft.website.*`; login compression drops those under
 * `rxsoft.*`, so identity never reports `website` and it disappears from the
 * switcher. Here we re-add any such module when:
 *
 *   1. it is not already in the backend list,
 *   2. it shares the backend module's API provider (same service), and
 *   3. one of its permission roots is nested under that module and granted.
 */
export function deriveVisibleModules(
  backendModules: BackendModule[],
  userPermissions: string[] = []
): BackendModule[] {
  const present = new Set(backendModules.map((mod) => mod.id));
  const derived: BackendModule[] = [];

  for (const definition of frontendModules) {
    if (present.has(definition.id)) {
      continue;
    }

    const roots = definition.permissionRoots ?? [definition.id];
    const belongsToGrantedParent = backendModules.some((parent) => {
      if (parent.id === definition.id) {
        return false;
      }
      // Child modules are served by the same backend service as their parent.
      const parentDefinition = frontendModules.find((mod) => mod.id === parent.id);
      if (!parentDefinition || parentDefinition.apiProvider !== definition.apiProvider) {
        return false;
      }
      return roots.some(
        (root) =>
          (root === parent.id || root.startsWith(`${parent.id}.`)) &&
          isRootGranted(userPermissions, root)
      );
    });

    if (belongsToGrantedParent) {
      derived.push({
        id: definition.id,
        name: definition.title,
        description: definition.description,
        root: definition.root,
      });
    }
  }

  return [...backendModules, ...derived];
}
