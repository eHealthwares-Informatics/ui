import { type LinkProps } from '@tanstack/react-router';
import type { ModuleId } from '@/features/shared/module-data';

type User = {
  name: string;
  email: string;
  avatar: string;
};

type Team = {
  name: string;
  logo: React.ElementType;
  plan: string;
  moduleId: ModuleId;
};

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  modules?: ModuleId[];
};

type NavLink = BaseNavItem & {
  url?: LinkProps['to'] | (string & {});
  items?: NavLink[];
};

type NavCollapsible = NavLink;

type NavItem = NavLink;

type SidebarData = {
  user: User;
  teams: Team[];
  navGroups: NavItem[];
};

type SidebarNavProps = {
  navGroups: NavItem[];
  title: string;
  icon?: React.ElementType;
  collapsed?: boolean;
};
export type { SidebarData, SidebarNavProps, NavItem, NavCollapsible, NavLink };
