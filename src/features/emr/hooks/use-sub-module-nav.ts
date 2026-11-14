import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Baby,
  Bed,
  ClipboardList,
  FileText,
  HeartPulse,
  Layers3,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import type { NavItem } from '@/layout/types';
import { emrApi } from '@/lib/emr-api';
import { useAuthStore } from '@/stores/auth-store';
import type { SubModuleNavigation } from '../lib/emr-types';

const ICONS: Record<string, LucideIcon> = {
  Activity,
  Baby,
  Bed,
  ClipboardList,
  FileText,
  HeartPulse,
  Layers3,
  Stethoscope,
};

/** Resolve a stored lucide icon name, falling back to a neutral group icon. */
export function resolveSubModuleIcon(name?: string | null): LucideIcon {
  if (!name) {
    return Layers3;
  }
  return ICONS[name] ?? Layers3;
}

/** Menu-level role gate: super_admin and empty role lists always pass. */
export function canSeeFeature(
  roleCodes: string[],
  userRoles: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) {
    return true;
  }
  if (roleCodes.length === 0) {
    return true;
  }
  return roleCodes.some((code) => userRoles.includes(code));
}

/** Pure mapping from the navigation payload to sidebar groups (test seam). */
export function buildSubModuleNav(
  data: SubModuleNavigation[] | undefined,
  userRoles: string[],
  isSuperAdmin: boolean
): NavItem[] {
  return (data ?? [])
    .map((subModule) => {
      const features = subModule.features
        .filter((feature) => canSeeFeature(feature.roleCodes ?? [], userRoles, isSuperAdmin))
        .sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        title: subModule.name,
        icon: resolveSubModuleIcon(subModule.icon),
        modules: ['emr' as const],
        items: features.map((feature) => ({
          title: feature.name,
          url: `/emr/features/${feature.id}`,
          icon: FileText,
          modules: ['emr' as const],
        })),
      };
    })
    .filter((group) => group.items.length > 0);
}

/**
 * Sidebar groups for runtime-defined EMR SubModules. Features are filtered by
 * the user's identity roles (menu-only enforcement); groups with no visible
 * features are dropped.
 */
export function useSubModuleNav(moduleId: string): NavItem[] {
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);

  const { data } = useQuery({
    queryKey: ['emr', 'sub-modules', 'navigation'],
    queryFn: async () => {
      const response = await emrApi.get<{ data: SubModuleNavigation[] }>('/sub-modules/navigation');
      return response.data.data;
    },
    enabled: moduleId === 'emr',
    staleTime: 60_000,
  });

  return useMemo(() => {
    if (moduleId !== 'emr') {
      return [];
    }
    return buildSubModuleNav(data, userRoles, isSuperAdmin);
  }, [data, moduleId, isSuperAdmin, userRoles]);
}
