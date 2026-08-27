import { ModuleId, modules } from '@/features/shared/module-data';

export type RouteModuleMapping = Record<string, ModuleId[]>;

const routeModuleMap: RouteModuleMapping = {};

for (const mod of modules) {
  for (const route of mod.routes) {
    routeModuleMap[route] = [mod.id, 'admin'];
  }
}

routeModuleMap['/'] = ['rxsoft', 'conversation', 'communication', 'admin'];
routeModuleMap['/dashboard'] = ['rxsoft', 'conversation', 'communication', 'admin'];
routeModuleMap['/dashboard/sales'] = ['rxsoft', 'admin'];
routeModuleMap['/dashboard/purchases'] = ['rxsoft', 'admin'];

export { routeModuleMap };

export function isRouteAllowedForModule(pathname: string, moduleId: ModuleId): boolean {
  if (moduleId === 'admin') {
    return true;
  }

  if (routeModuleMap[pathname]) {
    return routeModuleMap[pathname].includes(moduleId);
  }

  const pathSegments = pathname.split('/').filter(Boolean);
  if (pathSegments.length > 1) {
    const parentRoute = `/${pathSegments[0]}`;
    if (routeModuleMap[parentRoute]) {
      return routeModuleMap[parentRoute].includes(moduleId);
    }
  }

  return true;
}

export function getModuleDashboard(moduleId: ModuleId): string {
  const mod = modules.find((m) => m.id === moduleId);
  return mod?.root ?? '/';
}

export function getModuleFromPath(pathname: string): ModuleId | null {
  if (routeModuleMap[pathname]) {
    const allowed = routeModuleMap[pathname];
    return (allowed[0] as ModuleId) ?? null;
  }
  const sorted = [...modules].sort((a, b) => b.routes.length - a.routes.length);
  for (const mod of sorted) {
    if (mod.routes.some((route) => pathname.startsWith(route + '/') || pathname === route)) {
      return mod.id;
    }
  }
  return null;
}
