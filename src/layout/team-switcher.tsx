import { Menu, UnstyledButton, Stack, Text, Box, Loader } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModuleId, useSetSelectedModule } from '@/context/module-context';
import type { ModuleId } from '@/features/shared/module-data';
import { moduleIcons, modulePlans, moduleCards } from '@/features/shared/module-meta';
import { getModuleDashboard } from '@/lib/module-routing';
import { useAuthStore, type ModuleInfo } from '@/stores/auth-store';
import classes from './team-switcher.module.css';

function toTeams(modules: ModuleInfo[]) {
  return modules.map((mod) => ({
    name: mod.name,
    iconSrc: moduleCards[mod.id]?.icon,
    logo: moduleIcons[mod.id] || Shield,
    plan: modulePlans[mod.id] || mod.description,
    moduleId: mod.id as ModuleId,
  }));
}

export function TeamSwitcher({ compact = false }: { compact?: boolean } = {}) {
  const navigate = useNavigate();
  const moduleId = useModuleId();
  const setSelectedModuleId = useSetSelectedModule();
  const storeModules = useAuthStore((state) => state.modules);
  const fetchModules = useAuthStore((state) => state.fetchModules);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && storeModules.length === 0) {
      fetchModules();
    }
  }, [user, storeModules.length, fetchModules]);

  const teams = toTeams(storeModules);
  // Hook must stay above the empty-teams early return: modules are cleared on
  // logout, and a conditional useState here made the hook count drop
  // ("Rendered fewer hooks than expected") the moment the user signed out.
  const [opened, setOpened] = useState(false);
  const activeTeam = teams.find((t) => t.moduleId === moduleId) ?? teams[0];
  if (teams.length === 0) {
    return (
      <Box p="sm">
        <Loader size="sm" />
      </Box>
    );
  }

  const activeLogo = activeTeam?.logo;
  const ActiveLogo = activeLogo;
  const activeIcon = activeTeam?.iconSrc ? (
    <img className={classes.icon} src={activeTeam.iconSrc} alt="" aria-hidden="true" />
  ) : activeLogo ? (
    <span className={classes.iconFallback}>
      <ActiveLogo size={16} />
    </span>
  ) : null;

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      width={compact ? 230 : 220}
      position="bottom-start"
      offset={6}
    >
      <Menu.Target>
        <UnstyledButton
          className={`${classes.trigger} ${compact ? classes.triggerCompact : ''}`}
          data-testid="team-switcher-trigger"
          onClick={() => setOpened((o) => !o)}
        >
          <span className={classes.row}>
            {activeIcon}
            <span className={classes.text}>
              <span className={classes.name}>{activeTeam?.name ?? 'Select Module'}</span>
              {!compact && <span className={classes.plan}>{activeTeam?.plan ?? ''}</span>}
            </span>
            <ChevronsUpDown className={classes.chevrons} size={15} />
          </span>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Modules</Menu.Label>

        {teams.map((team, index) => {
          const Logo = team.logo;
          const menuIcon = team.iconSrc ? (
            <img className={classes.menuIcon} src={team.iconSrc} alt="" aria-hidden="true" />
          ) : (
            <span className={classes.menuFallback}>
              <Logo size={14} />
            </span>
          );
          return (
            <Menu.Item
              key={team.moduleId}
              onClick={() => {
                setSelectedModuleId(team.moduleId);
                navigate({ to: getModuleDashboard(team.moduleId) });
              }}
              leftSection={menuIcon}
              rightSection={
                <Text size="xs" c="dimmed">
                  ⌘{index + 1}
                </Text>
              }
            >
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {team.name}
                </Text>
                <Text size="10px" c="dimmed">
                  {team.plan}
                </Text>
              </Stack>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
