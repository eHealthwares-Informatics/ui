import { Avatar, Group, Menu, Stack, Text, UnstyledButton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  CreditCard,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { SignOutDialog } from '@/components/sign-out-dialog';
import classes from './nav-user.module.css';

type NavUserProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  /**
   * Header variant: avatar + name on one line, no secondary role line, so the
   * trigger fits in the app header instead of a full-width sidebar row.
   */
  compact?: boolean;
};

export function NavUser({ user, compact = false }: NavUserProps) {
  const [opened, setOpened] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      {/*
        bottom-end, not right-end: `right-*` places the dropdown *beside* the
        trigger, which at the right edge of the header flips it out of the
        viewport and lands it awkwardly. Below + right-aligned reads as a
        normal account menu.
      */}
      <Menu opened={opened} onChange={setOpened} position="bottom-end" offset={4} width={240}>
        <Menu.Target>
          <UnstyledButton
            className={`${classes.trigger} ${compact ? classes.triggerCompact : ''}`}
            data-testid="nav-user-trigger"
          >
            <span className={classes.row}>
              {user.avatar ? (
                <Avatar src={user.avatar} radius="xl" size="sm" />
              ) : (
                <span className={classes.avatar}>
                  <UserRound size={16} />
                </span>
              )}
              <span className={classes.text}>
                <span className={classes.name}>{user.name}</span>
                {!compact && <span className={classes.role}>{user.email}</span>}
              </span>
              <ChevronDown className={classes.chevron} size={15} />
            </span>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            <Group gap="sm">
              <Avatar src={user.avatar} radius="xl" size="sm">
                <UserRound size={14} />
              </Avatar>
              <Stack gap={0}>
                <Text size="sm" fw={600}>
                  {user.name}
                </Text>
                {!compact && <Text size="xs" c="dimmed">{user.email}</Text>}
              </Stack>
            </Group>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Item
            component={Link}
            to="/settings/account"
            leftSection={<BadgeCheck size={14} />}
          >
            Account
          </Menu.Item>

          <Menu.Item
            component={Link}
            to="/settings"
            leftSection={<CreditCard size={14} />}
          >
            Billing
          </Menu.Item>

          <Menu.Item
            component={Link}
            to="/settings/notifications"
            leftSection={<Bell size={14} />}
          >
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
