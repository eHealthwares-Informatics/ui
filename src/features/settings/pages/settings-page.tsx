import { Box, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { Outlet, useRouterState } from '@tanstack/react-router';
import { Bell, Palette, Settings2, UserCog, Monitor } from 'lucide-react';
import { useMemo } from 'react';
import { useModuleContext } from '@/context/module-context';
import { Main } from '@/layout/main';
import { SidebarNavItem } from '../components/sidebar-nav';

export function Settings() {
  // Settings pages live under the active module's root (e.g. /rxsoft/settings).
  // The links must be module-scoped or they fall through to the generic
  // /$page/$id detail route, which renders a loader forever for an unknown
  // record (the "/settings/account loading indefinitely" bug).
  const { moduleRoot } = useModuleContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // `moduleRoot` is the dashboard path (/rxsoft/dashboard); settings sit at the
  // module's first path segment (/rxsoft/settings).
  const moduleBase = `/${moduleRoot.split('/').filter(Boolean)[0] ?? 'rxsoft'}`;

  const sidebarNavItems = useMemo(
    () => [
      { title: 'Profile', url: `${moduleBase}/settings`, icon: UserCog },
      { title: 'Account', url: `${moduleBase}/settings/account`, icon: Settings2 },
      { title: 'Appearance', url: `${moduleBase}/settings/appearance`, icon: Palette },
      { title: 'Notifications', url: `${moduleBase}/settings/notifications`, icon: Bell },
      { title: 'Display', url: `${moduleBase}/settings/display`, icon: Monitor },
    ],
    [moduleBase]
  );

  return (
    <Main>
      {/* ===== Top Heading ===== */}
      <Stack gap="xs">
        <Title order={1}>Settings</Title>

        <Text c="dimmed">Manage your account settings and set e-mail preferences.</Text>
      </Stack>

      <Divider my="md" />

      <Box
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: '2rem',
          flexDirection: 'column',
        }}
      >
        {/* Mobile / Tablet */}
        <Box hiddenFrom="lg">
          {/* {sidebarNavItems.map((item) => (<SidebarNavItem key={item.title} item={sidebarNavItems} />)} */}
        </Box>

        {/* Desktop */}
        <Group
          align="flex-start"
          gap="xl"
          wrap="nowrap"
          visibleFrom="lg"
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              width: '20%',
              position: 'sticky',
              top: 0,
            }}
          >
            {sidebarNavItems.map((item, i) => (
              <SidebarNavItem
                key={item.title}
                pathname={pathname}
                expanded={false}
                index={i}
                item={item}
                resetExpandState={() => 2}
              />
            ))}
            {/* <SidebarNav items={sidebarNavItems} />} */}
          </Box>

          <Box
            style={{
              flex: 1,
              overflow: 'hidden',
              padding: '0.25rem',
            }}
          >
            <Outlet />
          </Box>
        </Group>

        {/* Mobile Outlet */}
        <Box hiddenFrom="lg">
          <Outlet />
        </Box>
      </Box>
    </Main>
  );
}
