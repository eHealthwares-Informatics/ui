import { UnstyledButton, Group, Text, Tooltip, Stack, Menu, Badge, Box } from '@mantine/core';
import { Link, useLocation } from '@tanstack/react-router';
import { LinkComponent } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { NavItem } from './types';

function isActive(pathname: string, href?: string, item?: NavItem) {
  if (!href) {
    return false;
  }

  return (
    pathname === href ||
    pathname.split('?')[0] === href ||
    (item?.items?.some((i) => i.url && pathname === i.url) ?? false) ||
    (pathname.split('/')[1] !== '' && pathname.split('/')[1] === href.split('/')[1])
  );
}
function NavButton({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Box
      key={item.title}
      px="sm"
      py="xs"
      style={{
        borderRadius: 6,
        background: item.title === 'Organization' ? 'var(--mantine-color-dark-6)' : undefined,
        cursor: 'pointer',
      }}
    >
      <Group gap="sm">
        {Icon ? <Icon size={16} /> : null}
        <Text size="sm">{item.title}</Text>
      </Group>
    </Box>
  );
}

export function NavGroup({ items, collapsed }: { items: NavItem[]; collapsed?: boolean }) {
  const location = useLocation();

  const pathname = location.pathname;

  return (
    <Stack gap={4}>
      {items.map((item) => {
        const active = isActive(pathname, item.url, item);

        // ----------------------------
        // COLLAPSED MODE (popover menu)
        // ----------------------------
        if (collapsed && item.items?.length) {
          return (
            <Menu key={item.title} position="right-start" shadow="md">
              <Menu.Target>
                <Tooltip label={item.title} position="right">
                  <Group justify="center">{item.badge}</Group>
                </Tooltip>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{item.title}</Menu.Label>

                {item.items.map((sub) => (
                  <Link key={sub.title} to={sub.url}>
                    <Menu.Item leftSection={sub.badge}>{sub.title}</Menu.Item>
                  </Link>
                ))}
              </Menu.Dropdown>
            </Menu>
          );
        }

        // ----------------------------
        // NORMAL ITEM (no children)
        // ----------------------------
        if (!item.items?.length) {
          const content = <NavButton item={item} active={active} collapsed={collapsed} />;

          const wrappedContent = item.url ? (
            <Link key={item.title} to={item.url}>
              {content}
            </Link>
          ) : (
            <div key={item.title}>{content}</div>
          );

          return collapsed ? (
            <Tooltip label={item.title} position="right">
              {wrappedContent}
            </Tooltip>
          ) : (
            wrappedContent
          );
        }

        // ----------------------------
        // EXPANDED COLLAPSIBLE GROUP
        // ----------------------------
        return (
          <Stack key={item.title} gap={4}>
            {item.url ? (
              <Link to={(item as any).url}>
                <NavButton item={item} active={active} collapsed={collapsed} />
              </Link>
            ) : (
              <NavButton item={item} active={active} collapsed={collapsed} />
            )}

            {!collapsed && (
              <Stack pl={28} gap={2}>
                {item.items.map((sub) => {
                  const subActive = isActive(pathname, sub.url, sub);

                  return (
                    <Link key={sub.title} to={sub.url}>
                      <UnstyledButton
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: subActive ? 'var(--mantine-color-gray-2)' : 'transparent',
                        }}
                      >
                        <Group gap="sm">
                          {sub.badge}
                          <Text size="sm">{sub.title}</Text>
                        </Group>
                      </UnstyledButton>
                    </Link>
                  );
                })}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
