import { Menu, UnstyledButton, Group, Stack, Text, Box, Loader } from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ChevronsUpDown, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useModuleId, useSetSelectedModule } from '@/context/module-context';
import type { ModuleId } from '@/features/shared/module-data';
import { moduleIcons, modulePlans } from '@/features/shared/module-meta';
import { getModuleDashboard } from '@/lib/module-routing';
import { useAuthStore, type ModuleInfo } from '@/stores/auth-store';

function toTeams(modules: ModuleInfo[]) {
  return modules.map((mod) => ({
    name: mod.name,
    logo: moduleIcons[mod.id] || Shield,
    plan: modulePlans[mod.id] || mod.description,
    moduleId: mod.id as ModuleId,
  }));
}

export function TeamSwitcher() {
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

  return (
    <Menu opened={opened} onChange={setOpened} width={220} position="right-start" offset={6}>
      <Menu.Target>
        <UnstyledButton
          data-testid="team-switcher-trigger"
          onClick={() => setOpened((o) => !o)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 8,
          }}
        >
          <Group gap="sm">
            <Box
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: 'var(--mantine-color-blue-6)',
                color: 'white',
              }}
            >
              {activeTeam && <activeTeam.logo size={16} />}
            </Box>

            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" fw={600} truncate>
                {activeTeam?.name ?? 'Select Module'}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {activeTeam?.plan ?? ''}
              </Text>
            </Stack>

            <ChevronsUpDown size={16} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Teams</Menu.Label>

        {teams.map((team, index) => (
          <Menu.Item
            key={team.moduleId}
            onClick={() => {
              setSelectedModuleId(team.moduleId);
              navigate({ to: getModuleDashboard(team.moduleId) });
            }}
            leftSection={<team.logo size={14} />}
            rightSection={
              <Text size="xs" c="dimmed">
                ⌘{index + 1}
              </Text>
            }
          >
            {team.name}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
