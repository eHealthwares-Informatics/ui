import { Box, Collapse, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { NavItem } from '@/layout/types';
import classes from './sidebar-nav.module.css';

function SubMenuLinks({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <Stack gap={2} className={classes.subList}>
      {items.map((subItem) => {
        const subActive = pathname === subItem.url;
        return (
          <div key={subItem.title}>
            {subItem.url ? (
              <Link to={subItem.url}>
                <UnstyledButton
                  className={`${classes.subItem} ${subActive ? classes.subItemActive : ''}`}
                >
                  {subItem.icon && <subItem.icon size={14} />}
                  <Text size="xs" fw={subActive ? 600 : 500}>
                    {subItem.title}
                  </Text>
                </UnstyledButton>
              </Link>
            ) : (
              <UnstyledButton
                className={`${classes.subItem} ${subActive ? classes.subItemActive : ''}`}
              >
                {subItem.icon && <subItem.icon size={14} />}
                <Text size="xs" fw={subActive ? 600 : 500}>
                  {subItem.title}
                </Text>
              </UnstyledButton>
            )}
            {subItem.items?.length ? (
              <SubMenuLinks items={subItem.items} pathname={pathname} />
            ) : null}
          </div>
        );
      })}
    </Stack>
  );
}

export function SidebarNavItem({
  item,
  pathname,
  collapsed = false,
  expanded = false,
  resetExpandState,
  index,
}: {
  item: NavItem;
  pathname: string;
  collapsed?: boolean;
  resetExpandState: (index: number, expanded: boolean) => void;
  expanded: boolean;
  index: number;
}) {
  const hasChildren = Boolean(item.items?.length);
  const sectionCount = item.items?.length ?? 0;

  const active = useMemo(() => {
    if (!item.url) {
      return false;
    }

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
      className={`${classes.item} ${active ? classes.itemActive : ''}`}
      onClick={() => {
        if (hasChildren) {
          resetExpandState(index, expanded);
        }
      }}
    >
      <div className={classes.row}>
        <div className={classes.left}>
          {Icon && (
            <span className={classes.iconWrap}>
              <Icon size={16} />
            </span>
          )}
          {!collapsed && (
            <div className={classes.text}>
              <span className={classes.title}>{item.title}</span>
              {sectionCount > 0 && (
                <span className={classes.subtitle}>
                  {sectionCount} section{sectionCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>
        {!collapsed && hasChildren && (
          <span className={classes.chevron}>
            {opened ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>
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
          <SubMenuLinks items={item.items ?? []} pathname={pathname} />
        </Collapse>
      )}
    </Stack>
  );
}
