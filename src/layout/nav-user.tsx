import { Avatar, Group, Text, UnstyledButton, Menu, Stack } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { ChevronsUpDown, BadgeCheck, Bell, CreditCard, LogOut, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { SignOutDialog } from '@/components/sign-out-dialog';

type NavUserProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
};

export function NavUser({ user }: NavUserProps) {
  const [opened, setOpened] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      <Menu opened={opened} onChange={setOpened} position="right-end" offset={4} width={220}>
        <Menu.Target>
          <UnstyledButton data-testid="nav-user-trigger" style={{ width: '100%' }}>
            <Group gap="sm">
              <Avatar src={user.avatar} radius="md" size="sm" />

              <Stack gap={0} style={{ flex: 1 }}>
                <Text size="sm" fw={600} truncate>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Stack>

              <ChevronsUpDown size={16} />
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          {/* User preview */}
          <Menu.Label>
            <Group gap="sm">
              <Avatar src={user.avatar} radius="md" size="sm" />
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {user.email}
                </Text>
              </Stack>
            </Group>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Item leftSection={<Sparkles size={14} />}>Upgrade to Pro</Menu.Item>

          <Menu.Divider />

          <Menu.Item component={Link} to="/settings/account" leftSection={<BadgeCheck size={14} />}>
            Account
          </Menu.Item>

          <Menu.Item component={Link} to="/settings" leftSection={<CreditCard size={14} />}>
            Billing
          </Menu.Item>

          <Menu.Item component={Link} to="/settings/notifications" leftSection={<Bell size={14} />}>
            Notifications
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            data-testid="sign-out-menu-item"
            color="red"
            leftSection={<LogOut size={14} />}
            onClick={() => setSignOutOpen(true)}
          >
            Sign out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <SignOutDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
