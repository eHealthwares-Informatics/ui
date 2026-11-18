import { CloseButton, TextInput } from '@mantine/core';
import { Search } from 'lucide-react';
import type { NavItem } from './types';

/**
 * Filter the role/module-scoped sidebar groups by menu title. Matching groups
 * open fully; when only a child matches, the group is kept with the matching
 * descendants. Nested items are filtered recursively.
 */
export function filterNavGroupsBySearch(groups: NavItem[], query: string): NavItem[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return groups;
  }

  const filterItem = (item: NavItem): NavItem | null => {
    const titleMatch = item.title.toLowerCase().includes(term);
    if (titleMatch) {
      // A matching group/menu keeps everything beneath it.
      return item;
    }

    const children = (item.items ?? [])
      .map(filterItem)
      .filter((child): child is NavItem => child !== null);
    if (children.length > 0) {
      return { ...item, items: children };
    }
    return null;
  };

  return groups.map(filterItem).filter((group): group is NavItem => group !== null);
}

/** Full-width sidebar menu search. Mirrors the patient lookup input. */
export function MenuSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      placeholder="Search menus…"
      aria-label="Search menus"
      leftSection={<Search size={14} />}
      rightSection={
        value ? (
          <CloseButton aria-label="Clear menu search" onClick={() => onChange('')} />
        ) : undefined
      }
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      data-testid="sidebar-menu-search"
    />
  );
}
