import { AppShell, Stack, ScrollArea, Box, Divider, Text } from '@mantine/core';
import { useLocation } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModuleId } from '@/context/module-context';
import { useCurrentLocation } from '@/features/emr/hooks/use-current-location';
import { useSubModuleNav } from '@/features/emr/hooks/use-sub-module-nav';
import { SidebarNavItem } from '@/features/settings/components/sidebar-nav';
import { moduleMap, type ModuleId } from '@/features/shared/module-data';
import { displayNameOf } from '@/lib/user-name';
import { useAuthStore } from '@/stores/auth-store';
import { filterNavGroupsByModule, sidebarData } from './data/sidebar-data';
import { filterNavGroupsBySearch, MenuSearch } from './menu-search';
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
  const [menuQuery, setMenuQuery] = useState('');
  const visibleGroups = filterNavGroupsBySearch(navGroups, menuQuery);
  const [expandState, setExpandState] = useState<boolean[]>(visibleGroups.map(() => false));

  // Switching modules, loading runtime SubModule groups, or changing the menu
  // search rebuilds the visible groups; index-keyed expansion state from the
  // previous list would otherwise leak into the new one.
  useEffect(() => {
    setExpandState(visibleGroups.map(() => false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, navGroupsKey, menuQuery]);

  // The menu query is scoped to the selected module; clear it when the user
  // switches modules so a search from EMR cannot hide another module's menus.
  useEffect(() => {
    setMenuQuery('');
  }, [moduleId]);

  const resetExpandState = (index: number, expanded: boolean) => {
    setExpandState(visibleGroups.map((_, i) => (i === index ? !expanded : false)));
  };

  return (
    <AppShell.Navbar
      className={classes.navbar}
      p={collapsed ? 8 : 'sm'}
      w={{ base: collapsed ? 76 : 260 }}
      data-testid="app-sidebar"
    >
      <Stack h="100%" gap="xs">
        {/* BRAND */}
        <Box className={`${classes.brand} ${collapsed ? classes.brandCollapsed : ''}`}>
          <img className={classes.brandMark} src="/assets/brand-hex.png" alt="RxSoft" />
          {!collapsed && (
            <Box className={classes.brandText}>
              <span className={classes.brandName}>eHealthwares </span>
              <span className={classes.brandTagline}>
                {moduleMap[moduleId as ModuleId]?.title ?? 'RxSoft'}
              </span>
            </Box>
          )}
        </Box>

        {/* MENU SEARCH — filters the role/module-scoped menu list */}
        {!collapsed && <MenuSearch value={menuQuery} onChange={setMenuQuery} />}

        {/* NAVIGATION */}
        <ScrollArea flex={1} scrollbarSize={0} mt={4}>
          {visibleGroups.length === 0 ? (
            <Text size="xs" c="dimmed" px="xs" py="sm">
              No menus match “{menuQuery.trim()}”.
            </Text>
          ) : (
            visibleGroups.map((item, i) => (
              <SidebarNavItem
                key={`${item.title}-${i}`}
                item={item}
                pathname={pathname}
                resetExpandState={resetExpandState}
                expanded={menuQuery.trim() ? true : expandState[i]}
                index={i}
                collapsed={collapsed}
              />
            ))
          )}
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
