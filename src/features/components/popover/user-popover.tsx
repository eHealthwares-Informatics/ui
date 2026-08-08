import { Badge, Group, Stack, Text } from '@mantine/core';
import { ResourcePopover } from './resource-popover';

type UserPopoverProps = {
  userId: string | null;
  children?: React.ReactNode;
  fallback?: string;
};

export function UserPopover({ userId, children, fallback }: UserPopoverProps) {
  return (
    <ResourcePopover
      resourceId={userId}
      endpoint="/users"
      fallback={fallback}
      render={(data) => {
        const user = data as {
          username: string;
          roles?: string[];
          email?: string;
          isActive?: boolean;
        };
        return (
          <Stack gap="xs" miw={200}>
            <Group gap="xs">
              <Text fw={600} size="sm">{user.username}</Text>
              {user.isActive === false && (
                <Badge color="red" size="xs" variant="light">Inactive</Badge>
              )}
            </Group>
            {user.email && <Text size="xs" c="dimmed">{user.email}</Text>}
            {user.roles && user.roles.length > 0 && (
              <Group gap={4}>
                {user.roles.map((role) => (
                  <Badge
                    key={role}
                    color={role === 'admin' || role === 'super_admin' ? 'red' : 'blue'}
                    size="xs"
                    variant="light"
                  >
                    {role}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        );
      }}
    >
      {children}
    </ResourcePopover>
  );
}
