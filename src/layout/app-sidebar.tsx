import { AppShell, Stack, ScrollArea, Box, Divider, Badge, Group, Text } from '@mantine/core';
import { useLocation } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useModuleId, useModuleName } from '@/context/module-context';
import { PatientLookup } from '@/features/emr/components/shared/patient-lookup';
import { useCurrentLocation } from '@/features/emr/hooks/use-current-location';
import { SidebarNavItem } from '@/features/settings/components/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';
import { filterNavGroupsByModule, sidebarData } from './data/sidebar-data';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const moduleId = useModuleId();
  const moduleName = useModuleName();
  const { pathname } = useLocation();
  const { data: currentLocation } = useCurrentLocation(
    moduleId === 'emr' ? (user?.locationId ?? null) : null
  );

  const navGroups = filterNavGroupsByModule(sidebarData.navGroups, moduleId);
  const [expandState, setExpandState] = useState<boolean[]>(navGroups.map(() => false));

  const resetExpandState = (index: number, expanded: boolean) => {
    setExpandState(navGroups.map((_, i) => (i === index ? !expanded : false)));
  };
  return (
    <AppShell.Navbar
      p="sm"
      w={{ base: 250 }}
      style={{
        borderRight: '1px solid var(--mantine-color-gray-3)',
      }}
    >
      <Stack h="100%" gap="sm">
        {/* HEADER */}
        <Box>
          <Stack gap="md">
            <TeamSwitcher />

            <Badge
              variant="light"
              radius="xl"
              size="lg"
              styles={{
                root: {
                  width: 'fit-content',
                },
              }}
            >
              <Group gap={6}>
                <Text size="xs" fw={700}>
                  {moduleName}
                </Text>

                <Text size="10px" c="dimmed">
                  module
                </Text>
              </Group>
            </Badge>

            {moduleId === 'emr' && <PatientLookup />}

            {moduleId === 'emr' && (
              <Group gap={6} align="center">
                <Badge
                  variant="outline"
                  radius="xl"
                  styles={{
                    root: {
                      width: 'fit-content',
                    },
                  }}
                >
                  <Group gap={6}>
                    <MapPin size={12} />
                    <Text size="xs" fw={700}>
                      {currentLocation?.code ?? 'No location'}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {currentLocation?.name ?? '—'}
                    </Text>
                  </Group>
                </Badge>
                {user?.organizationId && (
                  <Badge variant="light" radius="xl" size="sm">
                    org {user.organizationId.slice(0, 8)}
                  </Badge>
                )}
              </Group>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* NAVIGATION */}
        <ScrollArea flex={1} scrollbarSize={0}>
          {navGroups.map((item, i) => (
            <SidebarNavItem
              key={item.title}
              item={item}
              pathname={pathname}
              resetExpandState={resetExpandState}
              expanded={expandState[i]}
              index={i}
              collapsed={false}
            />
          ))}
        </ScrollArea>

        <Divider />

        {/* FOOTER */}
        <NavUser
          user={{
            name: user?.username ?? 'RxSoft User',
            email: user?.roles?.join(', ') ?? 'No roles assigned',
            avatar: sidebarData.user.avatar,
          }}
        />
      </Stack>
    </AppShell.Navbar>
  );
}
