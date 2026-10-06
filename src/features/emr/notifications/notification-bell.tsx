import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Indicator,
  Popover,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from './use-notifications';
import { formatRelativeTime } from './relative-time';
import { NOTIFICATION_TYPE_COLORS, type NotificationItem } from './types';

function NotificationRow({
  item,
  onSelect,
}: {
  item: NotificationItem;
  onSelect: (item: NotificationItem) => void;
}) {
  const color = NOTIFICATION_TYPE_COLORS[item.type] ?? 'gray';
  return (
    <UnstyledButton
      data-testid={`notification-item-${item.id}`}
      onClick={() => onSelect(item)}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        background: item.read ? 'transparent' : 'var(--mantine-color-gray-0)',
        opacity: item.read ? 0.75 : 1,
      }}
    >
      <Stack gap={4}>
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Group gap={6} wrap="nowrap">
            <Badge size="xs" color={color} variant="light">
              {item.type}
            </Badge>
            {!item.read && (
              <Box
                data-testid={`notification-unread-dot-${item.id}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-blue-6)',
                }}
              />
            )}
          </Group>
          <Text size="10px" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </Group>

        <Text size="sm" fw={item.read ? 500 : 700}>
          {item.title}
        </Text>

        {item.body && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {item.body}
          </Text>
        )}

        {item.sourceEntityRef && (
          <Text size="xs" c="blue" fw={600}>
            {item.sourceEntityRef}
          </Text>
        )}
      </Stack>
    </UnstyledButton>
  );
}

export function NotificationBell() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const { items, unreadCount, isLoading, markRead, markAllRead, isMarkingAllRead } =
    useNotifications();

  const handleSelect = (item: NotificationItem) => {
    if (!item.read) {
      markRead(item.id);
    }
    if (item.sourceEntityType === 'request' && item.sourceEntityId) {
      close();
      navigate({
        to: '/emr/requests/$requestId',
        params: { requestId: item.sourceEntityId },
      });
    }
  };

  return (
    <Popover
      opened={opened}
      onClose={close}
      position="bottom-end"
      width={380}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        <Indicator
          disabled={unreadCount === 0}
          label={unreadCount > 99 ? '99+' : unreadCount}
          size={18}
          color="red"
          offset={6}
        >
          <ActionIcon
            data-testid="notification-bell"
            variant="subtle"
            size="lg"
            radius="xl"
            aria-label="Notifications"
            onClick={toggle}
          >
            <Bell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Group justify="space-between" px="md" py="sm">
          <Text fw={700} size="sm">
            Notifications
          </Text>
          <Button
            variant="subtle"
            size="compact-xs"
            leftSection={<CheckCheck size={14} />}
            onClick={() => markAllRead()}
            loading={isMarkingAllRead}
            disabled={unreadCount === 0}
            data-testid="notification-mark-all-read"
          >
            Mark all read
          </Button>
        </Group>

        <Divider />

        <ScrollArea.Autosize mah={420}>
          {isLoading && items.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              Loading notifications…
            </Text>
          )}

          {!isLoading && items.length === 0 && (
            <Stack align="center" gap={4} py="xl">
              <Bell size={24} color="var(--mantine-color-gray-5)" />
              <Text size="sm" c="dimmed">
                No notifications yet
              </Text>
            </Stack>
          )}

          {items.length > 0 && (
            <Stack gap={2} p={6}>
              {items.map((item) => (
                <NotificationRow key={item.id} item={item} onSelect={handleSelect} />
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
