import { AppShell } from '@mantine/core';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { LayoutProvider } from '@/context/layout-provider';
import { useModuleId, useSetSelectedModule } from '@/context/module-context';
import { AutoLogout } from '@/features/auth/auto-logout';
import { useModuleFavicon } from '@/features/shared/use-module-favicon';
import { useModuleTitle } from '@/features/shared/use-module-title';
import { getCookie } from '@/lib/cookies';
import { isRouteAllowedForModule, getModuleDashboard, getModuleFromPath } from '@/lib/module-routing';
import { AppSidebar } from './app-sidebar';

type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false';
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const moduleId = useModuleId();
  const setSelectedModule = useSetSelectedModule();
  useModuleFavicon(moduleId);
  useModuleTitle(moduleId);

  // // Sync selected module from URL pathname
  // useEffect(() => {
  //   const inferred = getModuleFromPath(pathname);
  //   if (inferred && inferred !== moduleId) {
  //     setSelectedModule(inferred);
  //   }
  // }, [pathname, moduleId, setSelectedModule]);

  // Guard: Check if current route is allowed for active module
  useEffect(() => {
    const inferred = getModuleFromPath(pathname);
    if (inferred && inferred !== moduleId) {
      if (inferred && inferred !== moduleId) {
        setSelectedModule(inferred);
      }
      if (!isRouteAllowedForModule(pathname, inferred)) {
        navigate({ to: getModuleDashboard(inferred) });
      }
    }

  }, [pathname, moduleId, navigate]);

  return (
    <AutoLogout>
      <LayoutProvider>
        <AppShell navbar={{ width: 260, breakpoint: 'sm' }} padding="md">
          <AppSidebar />
          <AppShell.Main>{children ?? <Outlet />}</AppShell.Main>
        </AppShell>
      </LayoutProvider>
    </AutoLogout>
  );
}
