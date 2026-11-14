import { AppShell, Stack, ScrollArea, Box, Divider, Tooltip } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutGrid, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModuleId } from '@/context/module-context';
import { PatientLookup } from '@/features/emr/components/shared/patient-lookup';
import { useCurrentLocation } from '@/features/emr/hooks/use-current-location';
import { useSubModuleNav } from '@/features/emr/hooks/use-sub-module-nav';
import { SidebarNavItem } from '@/features/settings/components/sidebar-nav';
import { displayNameOf } from '@/lib/user-name';
import { useAuthStore } from '@/stores/auth-store';
import { filterNavGroupsByModule, sidebarData } from './data/sidebar-data';
import { NavUser } from './nav-user';
import classes from './app-sidebar.module.css';

export function AppSidebar({ collapsed = false }: { collapsed?: boolean } = {}) {
  const user = useAuthStore((state) => state.user);
  const moduleId = useModuleId();
  const { pathname } = useLocation();
  const { data: currentLocation } = useCurrentLocation(
    moduleId === 'emr' ? (user?.locationId ?? null) : null
  );

  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;
  const staticGroups = filterNavGroupsByModule(
    sidebarData.navGroups,
    moduleId,
    user?.permissions ?? [],
    isSuperAdmin
  );
  const subModuleGroups = useSubModuleNav(moduleId);
  const navGroups = [...staticGroups, ...subModuleGroups];
  const navGroupsKey = navGroups.map((group) => group.title).join('|');
  const [expandState, setExpandState] = useState<boolean[]>(navGroups.map(() => false));

  // Switching modules (or loading runtime SubModule groups) rebuilds
  // `navGroups`; index-keyed expansion state from the previous menu would
  // otherwise leak into the new one.
  useEffect(() => {
    setExpandState(navGroups.map(() => false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, navGroupsKey]);

  const resetExpandState = (index: number, expanded: boolean) => {
    setExpandState(navGroups.map((_, i) => (i === index ? !expanded : false)));
  };
  const onModulesPage = pathname === '/modules';

  return (
    <AppShell.Navbar
      className={classes.navbar}
      p={collapsed ? 8 : 'sm'}
      w={{ base: collapsed ? 76 : 260 }}
    >
      <Stack h="100%" gap="xs">
        {/* BRAND */}
        <Box className={`${classes.brand} ${collapsed ? classes.brandCollapsed : ''}`}>
          <img className={classes.brandMark} src="/assets/brand-hex.png" alt="RxSoft" />
          {!collapsed && (
            <Box className={classes.brandText}>
              <span className={classes.brandName}>RxSoft</span>
              <span className={classes.brandTagline}>Electronic Health Record</span>
            </Box>
          )}
        </Box>

        {/* MODULES */}
        <Tooltip label="Modules" position="right" disabled={!collapsed} withArrow>
          <Link
            to="/modules"
            data-testid="sidebar-modules-link"
            aria-label="Modules"
            className={`${classes.modulesLink} ${onModulesPage ? classes.modulesLinkActive : ''} ${
              collapsed ? classes.modulesLinkCollapsed : ''
            }`}
          >
            <span className={classes.modulesIcon}>
              <LayoutGrid size={16} />
            </span>
            {!collapsed && 'Modules'}
          </Link>
        </Tooltip>

        {/* SEARCH (EMR) — a full-width input, so it only renders expanded */}
        {moduleId === 'emr' && !collapsed && <PatientLookup />}

        {/* NAVIGATION */}
        <ScrollArea flex={1} scrollbarSize={0} mt={4}>
          {navGroups.map((item, i) => (
            <SidebarNavItem
              key={`${item.title}-${i}`}
              item={item}
              pathname={pathname}
              resetExpandState={resetExpandState}
              expanded={expandState[i]}
              index={i}
              collapsed={collapsed}
            />
          ))}
        </ScrollArea>

        {/* FOOTER */}
        {user?.organizationId && !collapsed && (
          <Box className={classes.sectionRow}>
            <span className={classes.sectionIcon}>
              <MapPin size={14} />
            </span>
            <span className={classes.sectionText}>
              <span className={classes.sectionLabel}>{currentLocation?.code ?? 'No location'}</span>
              <span className={classes.sectionHint}>{currentLocation?.name ?? '—'}</span>
            </span>
          </Box>
        )}
        {user?.organizationId && !collapsed && (
          <Box className={classes.orgChip}>ORG {user.organizationId.slice(0, 8)}</Box>
        )}

        <Divider />

        <NavUser
          user={{
            name: user ? displayNameOf(user, 'RxSoft User') : 'RxSoft User',
            email: user?.roles?.join(', ') ?? 'No roles assigned',
            avatar: sidebarData.user.avatar,
          }}
        />
      </Stack>
    </AppShell.Navbar>
  );
}
