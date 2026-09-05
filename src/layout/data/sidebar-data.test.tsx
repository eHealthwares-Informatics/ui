import { filterNavGroupsByModule } from './sidebar-data';
import type { NavItem } from '../types';

const conversationGroup: NavItem = {
  title: 'Conversation',
  items: [
    { title: 'Conversations', url: '/conversation', modules: ['conversation', 'admin'] },
    { title: 'Participants', url: '/conversation/participants', modules: ['conversation', 'admin'] },
  ],
};

const rxsoftGroup: NavItem = {
  title: 'Catalog',
  items: [
    { title: 'Products', url: '/rxsoft/items', modules: ['rxsoft', 'admin'] },
    { title: 'Categories', url: '/rxsoft/categories', modules: ['rxsoft', 'admin'] },
  ],
};

const mixedGroup: NavItem = {
  title: 'Mixed',
  items: [
    { title: 'Item A', url: '/a', modules: ['conversation'] },
    { title: 'Item B', url: '/b', modules: ['rxsoft'] },
  ],
};

const noModulesGroup: NavItem = {
  title: 'Global',
  items: [
    { title: 'Settings', url: '/settings' },
  ],
};

describe('filterNavGroupsByModule', () => {
  it('shows only matching items for a specific module', () => {
    const result = filterNavGroupsByModule([conversationGroup], 'conversation');
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(2);
    expect(result[0].items![0].title).toBe('Conversations');
  });

  it('hides items not matching the module', () => {
    const result = filterNavGroupsByModule([rxsoftGroup], 'conversation');
    expect(result).toHaveLength(0);
  });

  it('shows all items when module is admin', () => {
    const result = filterNavGroupsByModule([conversationGroup, rxsoftGroup], 'admin');
    expect(result).toHaveLength(2);
    expect(result[0].items).toHaveLength(2);
    expect(result[1].items).toHaveLength(2);
  });

  it('shows items without modules array for any module', () => {
    const result = filterNavGroupsByModule([noModulesGroup], 'conversation');
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
  });

  it('filters mixed group correctly', () => {
    const result = filterNavGroupsByModule([mixedGroup], 'conversation');
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items![0].title).toBe('Item A');
  });

  it('removes groups where all items are filtered out', () => {
    const result = filterNavGroupsByModule([rxsoftGroup], 'conversation');
    expect(result).toHaveLength(0);
  });

  it('preserves groups with at least one matching item', () => {
    const result = filterNavGroupsByModule([mixedGroup], 'rxsoft');
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items![0].title).toBe('Item B');
  });

  it('returns empty array for empty input', () => {
    expect(filterNavGroupsByModule([], 'conversation')).toHaveLength(0);
  });

  it('handles group with empty items array', () => {
    const groupWithEmpty: NavItem = { title: 'Empty', items: [], url: undefined };
    const result = filterNavGroupsByModule([groupWithEmpty], 'conversation');
    expect(result).toHaveLength(0);
  });
});
