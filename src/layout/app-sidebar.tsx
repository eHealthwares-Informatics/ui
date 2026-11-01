import { AppShell, Stack, ScrollArea, Box, Divider, Tooltip } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutGrid, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useModuleId } from '@/context/module-context';
import { PatientLookup } from '@/features/emr/components/shared/patient-lookup';
import { useCurrentLocation } from '@/features/emr/hooks/use-current-location';
import { SidebarNavItem } from '@/features/settings/components/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';
import { displayNameOf } from '@/lib/user-name';
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

  const navGroups = filterNavGroupsByModule(
    sidebarData.navGroups,
    moduleId,
    user?.permissions ?? []
  );
  const [expandState, setExpandState] = useState<boolean[]>(navGroups.map(() => false));

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
              key={item.title}
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
              <span className={classes.sectionLabel}>
                {currentLocation?.code ?? 'No location'}
              </span>
              <span className={classes.sectionHint}>
                {currentLocation?.name ?? '—'}
              </span>
            </span>
          </Box>
        )}
        {user?.organizationId && !collapsed && (
          <Box className={classes.orgChip}>
            ORG {user.organizationId.slice(0, 8)}
          </Box>
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
