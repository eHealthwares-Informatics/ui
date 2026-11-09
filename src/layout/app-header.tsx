import { ActionIcon, AppShell, Group, Tooltip } from '@mantine/core';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NotificationBell } from '@/features/emr/notifications/notification-bell';
import { displayNameOf } from '@/lib/user-name';
import { useAuthStore } from '@/stores/auth-store';
import { sidebarData } from './data/sidebar-data';
import { LocationSwitcher } from './location-switcher';
import type { NavState } from './nav-state';
import { NavUser } from './nav-user';
import { OrganisationSwitcher } from './organisation-switcher';
import { TeamSwitcher } from './team-switcher';
import classes from './app-header.module.css';

/**
 * App-wide header: sits above every module and holds the controls that used to
 * be scattered through the sidebar — the navigation toggle, the module
 * switcher (which shows the active module's name), the working-location
 * switcher, notifications and the user menu.
 */
export function AppHeader({
  navState,
  isMobile,
  onToggleNav,
}: {
  navState: NavState;
  isMobile: boolean;
  onToggleNav: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const navHidden = !isMobile && navState === 'hidden';
  const ToggleIcon = navHidden ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = isMobile
    ? 'Toggle navigation'
    : navHidden
      ? 'Show sidebar'
      : navState === 'rail'
        ? 'Hide sidebar'
        : 'Collapse sidebar';

  return (
    <AppShell.Header className={classes.header}>
      <div className={classes.inner}>
        <div className={classes.left}>
          <Tooltip label={toggleLabel} withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              radius="xl"
              aria-label={toggleLabel}
              data-testid="header-nav-toggle"
              onClick={onToggleNav}
            >
              <ToggleIcon size={18} />
            </ActionIcon>
          </Tooltip>

          <TeamSwitcher compact />

          <OrganisationSwitcher />

          <span className={classes.divider} aria-hidden="true" />

          <span className={classes.locationSlot}>
            <LocationSwitcher />
          </span>
        </div>

        <div className={classes.right}>
          <NotificationBell />

          <span className={`${classes.divider} ${classes.dividerRight}`} aria-hidden="true" />

          <NavUser
            compact
            user={{
              name: user ? displayNameOf(user, 'RxSoft User') : 'RxSoft User',
              email: user?.roles?.join(', ') ?? 'No roles assigned',
              avatar: sidebarData.user.avatar,
            }}
          />
        </div>
      </div>
    </AppShell.Header>
  );
}
