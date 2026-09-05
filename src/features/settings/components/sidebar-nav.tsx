import {
  Box,
  Collapse,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { NavItem } from '@/layout/types';

interface SidebarNavItemProps {
  item: NavItem;
  pathname: string;
  collapsed?: boolean;
  resetExpandState: (index: number, expanded: boolean) => void;
  expanded: boolean;
  index: number;
}

export function SidebarNavItem({
  item,
  pathname,
  collapsed = false,
  expanded = false,
  resetExpandState,
  index,
}: SidebarNavItemProps) {
  const hasChildren = Boolean(item.items?.length);

  const active = useMemo(() => {
    if (!item.url) {return false;}

    return (
      pathname === item.url ||
      pathname.startsWith(`${item.url}/`) ||
      ((item.items || []) as unknown as any[]).some((sub: NavItem) => pathname === sub.url)
    );
  }, [pathname, item]);

  // Single source of truth: expanded controls both chevron and collapse
  const opened = expanded || active;

  const Icon = item.icon;

  const button = (
    <UnstyledButton
      onClick={() => {
        if (hasChildren) {
          resetExpandState(index, expanded);
        }
      }}
      style={{
        width: '100%',
        borderRadius: 10,
        transition: 'all 140ms ease',
        background: active ? 'var(--mantine-color-blue-light)' : 'transparent',
      }}
    >
      <Group justify="space-between" wrap="nowrap" px="sm" py={10}>
        {/* LEFT */}
        <Group gap="sm" wrap="nowrap">
          {Icon && (
            <ThemeIcon size={34} radius="md" variant={active ? 'filled' : 'light'}>
              <Icon size={18} />
            </ThemeIcon>
          )}

          {!collapsed && (
            <Box>
              <Text size="sm" fw={active ? 700 : 500} c={active ? 'blue' : undefined}>
                {item.title}
              </Text>

              {item.title && (
                <Text size="xs" c="dimmed">
                  {item.title}
                </Text>
              )}
            </Box>
          )}
        </Group>

        {/* RIGHT */}
        {!collapsed && hasChildren && (
          <>{opened ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</>
        )}
      </Group>
    </UnstyledButton>
  );

  /**
   * COLLAPSED SIDEBAR MODE
   */
  if (collapsed) {
    return (
      <Tooltip label={item.title} position="right" withArrow>
        <Box>{item.url ? <Link to={item.url}>{button}</Link> : button}</Box>
      </Tooltip>
    );
  }
  return (
    <Stack gap={4}>
      {/* ROOT ITEM */}
      {item.url ? <Link to={item.url}>{button}</Link> : button}

      {/* SUBMENU */}
      {hasChildren && (
        <Collapse expanded={expanded}>
          <Stack gap={2} pl={20}>
            {item.items?.map((subItem: NavItem) => {
              const subActive = pathname === subItem.url;

              return (
                <Link key={subItem.title} to={subItem.url}>
                  <UnstyledButton
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      padding: '10px 5px',
                      transition: 'all 140ms ease',
                      background: subActive ? 'var(--mantine-color-gray-1)' : 'transparent',
                    }}
                  >
                    <Group gap="sm">
                      {subItem.icon && <subItem.icon size={15} />}

                      <Text size="sm" fw={subActive ? 600 : 500}>
                        {subItem.title}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Link>
              );
            })}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
}
