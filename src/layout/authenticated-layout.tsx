import { AppShell } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { LayoutProvider } from '@/context/layout-provider';
import { useModuleId, useSetSelectedModule } from '@/context/module-context';
import { NotificationSubscriptionRegistrar } from '@/features/emr/notifications/notification-subscription';
import { AutoLogout } from '@/features/identity/auth/auto-logout';
import { useModuleFavicon } from '@/features/shared/use-module-favicon';
import { useModuleTitle } from '@/features/shared/use-module-title';
import {
  isRouteAllowedForModule,
  getModuleDashboard,
  getModuleFromPath,
} from '@/lib/module-routing';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { nextNavState, readNavState, writeNavState, type NavState } from './nav-state';

type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const moduleId = useModuleId();
  const setSelectedModule = useSetSelectedModule();
  useModuleFavicon(moduleId);
  useModuleTitle(moduleId);

  // Track the last path we navigated to in this guard so we don't re-navigate
  // to the same path on re-render (e.g. after setSelectedModule changes context).
  const lastNavigatedRef = useRef<string | null>(null);

  // Below the AppShell navbar breakpoint the sidebar becomes a slide-over
  // drawer; above it, the cookie-backed expanded/rail/hidden state applies.
  const isMobile = useMediaQuery('(max-width: 47.99em)', false);
  const [navState, setNavState] = useState<NavState>(() => readNavState());
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);

  const toggleNav = () => {
    if (isMobile) {
      toggleMobile();
      return;
    }
    const next = nextNavState(navState);
    setNavState(next);
    writeNavState(next);
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  // Guard: keep the active module unless it cannot serve this route.
  //
  // Admin (and the Website Console) own pages that live under `/rxsoft/...`,
  // so an unconditional re-infer would flip the switcher back to RxSoft the
  // moment one of those pages opened. Only switch when the *selected* module
  // does not allow the path, which is what the route table is for.
  useEffect(() => {
    if (isRouteAllowedForModule(pathname, moduleId)) {
      return;
    }
    const inferred = getModuleFromPath(pathname);
    if (inferred && inferred !== moduleId) {
      const target = getModuleDashboard(inferred);
      // Don't re-navigate to a path we just went to — prevents loops when
      // setSelectedModule changes context and re-triggers this effect.
      if (lastNavigatedRef.current === target) {
        return;
      }
      lastNavigatedRef.current = target;
      setSelectedModule(inferred);
      navigate({ to: target });
    }
  }, [pathname, moduleId, navigate, setSelectedModule]);

  return (
    <AutoLogout>
      <LayoutProvider>
        <NotificationSubscriptionRegistrar />
        <AppShell
          header={{ height: 56 }}
          navbar={{
            width: navState === 'rail' ? 76 : 260,
            breakpoint: 'sm',
            collapsed: { mobile: !mobileOpened, desktop: navState === 'hidden' },
          }}
          padding="md"
        >
          <AppHeader navState={navState} isMobile={isMobile} onToggleNav={toggleNav} />
          <AppSidebar collapsed={!isMobile && navState === 'rail'} />
          <AppShell.Main>{children ?? <Outlet />}</AppShell.Main>
        </AppShell>
      </LayoutProvider>
    </AutoLogout>
  );
}
