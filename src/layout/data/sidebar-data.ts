import {
  AudioWaveform,
  Boxes,
  Brain,
  ChartColumn,
  CircleDashed,
  MessageSquare,
  Cog,
  Command,
  ContactRound,
  CreditCard,
  FileText,
  GitBranch,
  HandCoins,
  LayoutDashboard,
  Layers3,
  Microscope,
  NotebookPen,
  Package,
  PackageSearch,
  Pill,
  Radio,
  ReceiptText,
  Scale,
  Shield,
  ShoppingCart,
  Shuffle,
  Tags,
  Truck,
  Users,
  Waypoints,
  Workflow,
  Store,
  BookOpen,
  HeartPulse,
  Receipt,
  ShieldCheck,
  MessagesSquare,
  Braces,
  Building2,
  ClipboardCheck,
  Stethoscope,
  CalendarDays,
  UserRound,
  Bed,
  FileSpreadsheet,
  FilePlus2,
  Hourglass,
  ClipboardList,
} from 'lucide-react';
import type { ModuleId } from '@/features/shared/module-data';
import { NavItem, type SidebarData } from '../types';

export function filterNavGroupsByModule(navGroups: NavItem[], selectedModule: ModuleId): NavItem[] {
  return navGroups
    .map((group: NavItem) => ({
      ...group,
      items: (group.items || []).filter(
        (item) =>
          selectedModule === 'admin' || !item.modules || item.modules.includes(selectedModule)
      ),
      url: undefined,
    }))
    .filter((group) => group.items.length > 0);
}

export const sidebarData: SidebarData = {
  user: {
    name: 'RxSoft User',
    email: 'Admin console',
    avatar: '',
  },
  teams: [
    {
      name: 'RxSoft',
      logo: Command,
      plan: 'Pharmacy Admin',
      moduleId: 'rxsoft',
    },
    {
      name: 'Switch',
      logo: AudioWaveform,
      plan: 'Messaging & Routing',
      moduleId: 'communication',
    },
    {
      name: 'Conversation',
      logo: MessageSquare,
      plan: 'Workflow Chat',
      moduleId: 'conversation',
    },
    {
      name: 'Coding Concept',
      logo: Boxes,
      plan: 'Terminology',
      moduleId: 'coding-concept',
    },
    {
      name: 'LIS',
      logo: Microscope,
      plan: 'Laboratory',
      moduleId: 'lis',
    },
    {
      name: 'EMR',
      logo: HeartPulse,
      plan: 'Electronic Medical Record',
      moduleId: 'emr',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      icon: LayoutDashboard,
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Reports',
          url: '/rxsoft/reports',
          icon: ChartColumn,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Audit Logs',
          url: '/rxsoft/audit-logs',
          icon: Package,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'Catalog',
      icon: BookOpen,
      items: [
        {
          title: 'Products',
          url: '/rxsoft/items',
          icon: Package,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Categories',
          url: '/rxsoft/categories',
          icon: Tags,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'UOMs',
          url: '/rxsoft/uoms',
          icon: Scale,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Manufacturers',
          url: '/rxsoft/manufacturers',
          icon: Truck,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Price Lists',
          url: '/rxsoft/price-lists',
          icon: Tags,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Price List Items',
          url: '/rxsoft/price-list-items',
          icon: ReceiptText,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'People',
      icon: Users,
      items: [
        {
          title: 'Users',
          url: '/rxsoft/users',
          icon: Users,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Customers',
          url: '/rxsoft/customers',
          icon: ContactRound,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Suppliers',
          url: '/rxsoft/suppliers',
          icon: Truck,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Roles',
          url: '/rxsoft/roles',
          icon: Shield,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'Operations',
      icon: Workflow,
      items: [
        {
          title: 'Sales',
          url: '/rxsoft/sales',
          icon: ShoppingCart,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Receivables',
          url: '/rxsoft/receivables',
          icon: HandCoins,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Purchases',
          url: '/rxsoft/purchases',
          icon: ReceiptText,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Payment Methods',
          url: '/rxsoft/payment-methods',
          icon: CreditCard,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Inventory',
          url: '/rxsoft/inventory',
          icon: Boxes,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Goods Receiving',
          url: '/rxsoft/receiving',
          icon: PackageSearch,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Website Orders',
          url: '/rxsoft/website-orders',
          icon: ShoppingCart,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Branches',
          url: '/rxsoft/branches',
          icon: GitBranch,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Settings',
          url: '/rxsoft/settings',
          icon: Cog,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'Finance',
      icon: Receipt,
      items: [
        {
          title: 'Chart of Accounts',
          url: '/rxsoft/gl-accounts',
          icon: BookOpen,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Journals',
          url: '/rxsoft/journals',
          icon: NotebookPen,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Journal Entries',
          url: '/rxsoft/journal-entries',
          icon: NotebookPen,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Journal Entry Lines',
          url: '/rxsoft/journal-entry-lines',
          icon: NotebookPen,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Trial Balance',
          url: '/rxsoft/reports/trial-balance',
          icon: Scale,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Balance Sheet',
          url: '/rxsoft/reports/balance-sheet',
          icon: FileText,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Income Statement',
          url: '/rxsoft/reports/income-statement',
          icon: ChartColumn,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'Website',
      icon: Store,
      items: [
        {
          title: 'Health Concerns',
          url: '/rxsoft/website-health-concerns',
          icon: HeartPulse,
          modules: ['admin'],
        },
        {
          title: 'Blog Articles',
          url: '/rxsoft/website-articles',
          icon: BookOpen,
          modules: ['admin'],
        },
        {
          title: 'Prescriptions',
          url: '/rxsoft/website-prescriptions',
          icon: FileText,
          modules: ['admin'],
        },
      ],
    },
    {
      title: 'Administration',
      icon: ShieldCheck,
      items: [
        {
          title: 'Organizations',
          url: '/rxsoft/organizations',
          icon: Shield,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Locations',
          url: '/rxsoft/stock-locations',
          icon: Store,
          modules: ['rxsoft', 'admin'],
        },
        {
          title: 'Warehouses',
          url: '/rxsoft/warehouses',
          icon: Building2,
          modules: ['rxsoft', 'admin'],
        },
      ],
    },
    {
      title: 'Conversation',
      icon: MessagesSquare,
      items: [
        {
          title: 'Questionnaires',
          url: '/conversation/questionnaires',
          icon: FileText,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Conversations',
          url: '/conversation',
          icon: MessageSquare,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Participants',
          url: '/conversation/participants',
          icon: ContactRound,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Questions',
          url: '/conversation/questions',
          icon: CircleDashed,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Exchanges',
          url: '/conversation/exchanges',
          icon: FileText,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Broadcasts',
          url: '/conversation/broadcasts',
          icon: FileText,
          modules: ['conversation', 'admin'],
        },
      ],
    },
    {
      title: 'Chat',
      icon: MessageSquare,
      items: [
        {
          title: 'Chats',
          url: '/conversation/chats',
          icon: MessageSquare,
          modules: ['conversation', 'admin'],
        },
      ],
    },
    {
      title: 'Channels',
      icon: Radio,
      items: [
        {
          title: 'Channels',
          url: '/conversation/channels',
          icon: Radio,
          modules: ['conversation', 'admin'],
        },
      ],
    },
    {
      title: 'AI',
      icon: Brain,
      items: [],
    },
    {
      title: 'Workflow',
      icon: Workflow,
      items: [
        {
          title: 'Workflows',
          url: '/conversation/workflows',
          icon: Workflow,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Workflow Configuration',
          url: '/conversation/workflow-configuration',
          icon: Workflow,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Workflow Instances',
          url: '/conversation/workflow-instances',
          icon: Shuffle,
          modules: ['conversation', 'admin'],
        },
        {
          title: 'Workflow Events',
          url: '/conversation/workflow-events',
          icon: Waypoints,
          modules: ['conversation', 'admin'],
        },
      ],
    },
    {
      title: 'Switch',
      icon: Waypoints,
      items: [
        {
          title: 'Application Entities',
          url: '/communication/aes',
          icon: MessageSquare,
          modules: ['communication', 'admin'],
        },
        {
          title: 'Routes',
          url: '/communication/routing',
          icon: MessageSquare,
          modules: ['communication', 'admin'],
        },
        {
          title: 'Mapping',
          url: '/communication/mapping',
          icon: MessageSquare,
          modules: ['communication', 'admin'],
        },
        {
          title: 'Event Traces',
          url: '/communication/audit-center',
          icon: FileText,
          modules: ['communication', 'admin'],
        },

        {
          title: 'Flow Graph',
          url: '/communication/flow-graph',
          icon: Layers3,
          modules: ['communication', 'admin'],
        },
        {
          title: 'Trace Explorer',
          url: '/communication/trace-explorer',
          icon: Waypoints,
          modules: ['communication', 'admin'],
        },
        {
          title: 'Message Tester',
          url: '/communication/message-tester',
          icon: MessageSquare,
          modules: ['communication', 'admin'],
        },
      ],
    },
    {
      title: 'Coding Concept',
      icon: Braces,
      items: [
        {
          title: 'Concept Registry',
          url: '/coding-concept',
          icon: Layers3,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Search',
          url: '/coding-concept/search',
          icon: Waypoints,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Match',
          url: '/coding-concept/match',
          icon: GitBranch,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Upload',
          url: '/coding-concept/upload',
          icon: FileText,
          modules: ['coding-concept', 'admin'],
        },
      ],
    },
    {
      title: 'Facility',
      icon: Building2,
      items: [
        {
          title: 'Facilities',
          url: '/coding-concept/facilities',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'States',
          url: '/coding-concept/facilities/states',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'LGAs',
          url: '/coding-concept/facilities/lgas',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Wards',
          url: '/coding-concept/facilities/wards',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Facility Types',
          url: '/coding-concept/facilities/types',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Facility Levels',
          url: '/coding-concept/facilities/levels',
          icon: Building2,
          modules: ['coding-concept', 'admin'],
        },
      ],
    },
    {
      title: 'Drugs',
      icon: Pill,
      items: [
        {
          title: 'Generic Drugs',
          url: '/coding-concept/generic-drugs',
          icon: Pill,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Pharmaceutics',
          url: '/coding-concept/pharmaceutics',
          icon: Pill,
          modules: ['coding-concept', 'admin'],
        },
        {
          title: 'Drug Components',
          url: '/coding-concept/drug-components',
          icon: Layers3,
          modules: ['coding-concept', 'admin'],
        },
      ],
    },
    {
      title: 'Tests',
      icon: Scale,
      items: [
        { title: 'Test Definitions', url: '/lis/test-definitions', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'Reference Ranges', url: '/lis/reference-ranges', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'Test Categories', url: '/lis/test-categories', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'Test Sections', url: '/lis/test-sections', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'Methods', url: '/lis/methods', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'Panels', url: '/lis/panels', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'UOMs', url: '/lis/uoms', icon: Scale, modules: ['lis', 'admin'] },
        { title: 'LOINC', url: '/lis/loinc', icon: Scale, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'Orders',
      icon: FileText,
      items: [
        { title: 'Orders', url: '/lis/orders', icon: FileText, modules: ['lis', 'admin'] },
        { title: 'Orders Dashboard', url: '/lis/orders/dashboard', icon: LayoutDashboard, modules: ['lis', 'admin'] },
        { title: 'New Order', url: '/lis/orders/new/enter', icon: FileText, modules: ['lis', 'admin'] },
        { title: 'Patients', url: '/lis/patients', icon: FileText, modules: ['lis', 'admin'] },
        { title: 'Priorities', url: '/lis/priorities', icon: FileText, modules: ['lis', 'admin'] },
        { title: 'Programs', url: '/lis/programs', icon: FileText, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'Results',
      icon: NotebookPen,
      items: [
        { title: 'Results', url: '/lis/results', icon: NotebookPen, modules: ['lis', 'admin'] },
        { title: 'Result Signatures', url: '/lis/result-signatures', icon: NotebookPen, modules: ['lis', 'admin'] },
        { title: 'Validation Dashboard', url: '/lis/validation-dashboard', icon: NotebookPen, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'Samples',
      icon: Boxes,
      items: [
        { title: 'Samples', url: '/lis/samples', icon: Boxes, modules: ['lis', 'admin'] },
        { title: 'Sample Types', url: '/lis/sample-types', icon: Boxes, modules: ['lis', 'admin'] },
        { title: 'Locations', url: '/lis/locations', icon: Boxes, modules: ['lis', 'admin'] },
        { title: 'Location Types', url: '/lis/location-types', icon: Boxes, modules: ['lis', 'admin'] },
        { title: 'Rejection Reasons', url: '/lis/rejection-reasons', icon: Boxes, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'Quality Control',
      icon: ChartColumn,
      items: [
        { title: 'QC Lots', url: '/lis/qc-lots', icon: ChartColumn, modules: ['lis', 'admin'] },
        { title: 'QC Results', url: '/lis/qc-results', icon: ChartColumn, modules: ['lis', 'admin'] },
        { title: 'QC Alerts', url: '/lis/qc-alerts', icon: ChartColumn, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'EQA',
      icon: ClipboardCheck,
      items: [
        { title: 'EQA Programs', url: '/lis/eqa-programs', icon: ClipboardCheck, modules: ['lis', 'admin'] },
        { title: 'EQA Enrollments', url: '/lis/eqa-enrollments', icon: ClipboardCheck, modules: ['lis', 'admin'] },
        { title: 'EQA Results', url: '/lis/eqa-results', icon: ClipboardCheck, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'Configuration',
      icon: Cog,
      items: [
        { title: 'Statuses', url: '/lis/statuses', icon: Cog, modules: ['lis', 'admin'] },
        { title: 'Attribute Definitions', url: '/lis/attribute-definitions', icon: Cog, modules: ['lis', 'admin'] },
      ],
    },
    {
      title: 'EMR',
      icon: HeartPulse,
      items: [
        { title: 'Dashboard', url: '/emr', icon: LayoutDashboard, modules: ['emr', 'admin'] },
        { title: 'Appointments', url: '/emr/appointments', icon: CalendarDays, modules: ['emr', 'admin'] },
        { title: 'Patients', url: '/emr/patients', icon: UserRound, modules: ['emr', 'admin'] },
        { title: 'Visits', url: '/emr/visits', icon: Bed, modules: ['emr', 'admin'] },
        { title: 'Encounters', url: '/emr/encounters', icon: Stethoscope, modules: ['emr', 'admin'] },
        { title: 'Forms', url: '/emr/forms', icon: FileSpreadsheet, modules: ['emr', 'admin'] },
        { title: 'Clinical Requests', url: '/emr/requests', icon: FilePlus2, modules: ['emr', 'admin'] },
      ],
    },
  ],
};
