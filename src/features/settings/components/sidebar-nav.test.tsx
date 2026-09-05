import { render, screen, fireEvent } from '@test-utils';
import { Shield, Users, FileText } from 'lucide-react';
import { SidebarNavItem } from './sidebar-nav';
import type { NavItem } from '@/layout/types';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: any) => <div data-testid="link" data-to={props.to}>{children}</div>,
}));

const baseItem: NavItem = {
  title: 'Test Group',
  icon: Shield,
  items: [
    { title: 'Child A', url: '/test/a', icon: Users },
    { title: 'Child B', url: '/test/b', icon: FileText },
  ],
};

const leafItem: NavItem = {
  title: 'Leaf',
  url: '/leaf',
  icon: Shield,
};

const noop = () => {};

describe('SidebarNavItem', () => {
  describe('rendering', () => {
    it('renders the item title text', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={false} />,
      );
      // Title appears twice (heading + subtitle) — use getAllByText
      const titles = screen.getAllByText('Test Group');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('renders child items when expanded', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={true} />,
      );
      expect(screen.getByText('Child A')).toBeInTheDocument();
      expect(screen.getByText('Child B')).toBeInTheDocument();
    });

    it('renders child link elements with correct urls when expanded', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={true} />,
      );
      const links = screen.getAllByTestId('link');
      const tos = links.map((l) => l.getAttribute('data-to'));
      expect(tos).toContain('/test/a');
      expect(tos).toContain('/test/b');
    });

    it('renders leaf item', () => {
      render(
        <SidebarNavItem item={leafItem} pathname="/other" index={0} resetExpandState={noop} expanded={false} />,
      );
      expect(screen.getAllByText('Leaf').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('active state', () => {
    it('auto-opens submenu when a child is active', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/test/a" index={0} resetExpandState={noop} expanded={false} />,
      );
      expect(screen.getByText('Child A')).toBeInTheDocument();
      expect(screen.getByText('Child B')).toBeInTheDocument();
    });

    it('does not auto-open submenu when no child is active', () => {
      const { container } = render(
        <SidebarNavItem item={baseItem} pathname="/unrelated" index={0} resetExpandState={noop} expanded={false} />,
      );
      // Children should not be visible (Collapse hides them)
      const childA = screen.queryByText('Child A');
      // Either not in DOM or hidden by Collapse
      if (childA) {
        expect(childA.closest('[style*="height: 0"]')).toBeTruthy();
      }
    });

    it('auto-opens when parent url matches pathname', () => {
      const itemWithUrl = { title: 'Group', icon: Shield, url: '/group', items: baseItem.items } as any;
      render(
        <SidebarNavItem item={itemWithUrl} pathname="/group" index={0} resetExpandState={noop} expanded={false} />,
      );
      expect(screen.getByText('Child A')).toBeInTheDocument();
    });

    it('auto-opens when pathname starts with parent url/', () => {
      const itemWithUrl = { title: 'Group', icon: Shield, url: '/group', items: baseItem.items } as any;
      render(
        <SidebarNavItem item={itemWithUrl} pathname="/group/detail" index={0} resetExpandState={noop} expanded={false} />,
      );
      expect(screen.getByText('Child A')).toBeInTheDocument();
    });
  });

  describe('click behavior', () => {
    it('calls resetExpandState on group click', () => {
      const spy = vi.fn();
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={2} resetExpandState={spy} expanded={false} />,
      );
      fireEvent.click(screen.getAllByText('Test Group')[0].closest('button')!);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(2, false);
    });

    it('passes true when already expanded', () => {
      const spy = vi.fn();
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={1} resetExpandState={spy} expanded={true} />,
      );
      fireEvent.click(screen.getAllByText('Test Group')[0].closest('button')!);
      expect(spy).toHaveBeenCalledWith(1, true);
    });

    it('does not call resetExpandState for leaf items', () => {
      const spy = vi.fn();
      render(
        <SidebarNavItem item={leafItem} pathname="/other" index={0} resetExpandState={spy} expanded={false} />,
      );
      fireEvent.click(screen.getAllByText('Leaf')[0].closest('button')!);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('chevron direction', () => {
    it('renders SVG icons for expand/collapse', () => {
      const { container: expanded } = render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={true} />,
      );
      expect(expanded.querySelectorAll('svg').length).toBeGreaterThan(0);

      const { container: collapsed } = render(
        <SidebarNavItem item={baseItem} pathname="/unrelated" index={0} resetExpandState={noop} expanded={false} />,
      );
      expect(collapsed.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });

  describe('collapsed mode', () => {
    it('hides titles when collapsed', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={false} collapsed={true} />,
      );
      expect(screen.queryByText('Test Group')).not.toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('wraps group in Link when item has url', () => {
      render(
        <SidebarNavItem item={leafItem} pathname="/other" index={0} resetExpandState={noop} expanded={false} />,
      );
      const links = screen.getAllByTestId('link');
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].getAttribute('data-to')).toBe('/leaf');
    });

    it('does not wrap root in Link when item has no url', () => {
      render(
        <SidebarNavItem item={baseItem} pathname="/" index={0} resetExpandState={noop} expanded={false} />,
      );
      // baseItem has no url → root is just a button, not a Link
      const rootButton = screen.getAllByText('Test Group')[0].closest('button');
      expect(rootButton).toBeTruthy();
      // The button itself is not inside a Link
      expect(rootButton!.closest('[data-testid="link"]')).toBeNull();
    });
  });
});
