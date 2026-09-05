import { AxiosInstance } from 'axios';
import { codingConceptApi } from '@/lib/coding-concept-api';
import { communicationApi } from '@/lib/communication-api';
import { conversationApi } from '@/lib/conversation-api';
import { emrApi } from '@/lib/emr-api';
import { lisApi } from '@/lib/lis-api';
import { rxsoftApi } from '@/lib/rxsoft-api';

export type ModuleId =
  | 'conversation'
  | 'communication'
  | 'coding-concept'
  | 'lis'
  | 'emr'
  | 'rxsoft'
  | 'admin'
  | 'website';

export type ModuleDefinition = {
  id: ModuleId;
  title: string;
  description: string;
  root: string;
  apiProvider: AxiosInstance;
  routes: string[];
  resources: string[];
};

export const modules: ModuleDefinition[] = [
  {
    id: 'conversation',
    title: 'Conversation',
    description: 'Conversation workspace with lists, inspectors, and chat operations.',
    root: '/conversation/dashboard',
    apiProvider: conversationApi,
    routes: [
      '/conversation',
      '/conversation/dashboard',
      '/conversation/participants',
      '/conversation/questionnaires',
      '/conversation/questions',
      '/conversation/option-lists',
      '/conversation/workflows',
      '/conversation/workflow-configuration',
      '/conversation/workflow-instances',
      '/conversation/workflow-events',
      '/conversation/channels',
      '/conversation/exchanges',
      '/conversation/invites',
    ],
    resources: [
      'conversations',
      'participants',
      'questionnaires',
      'questions',
      'option-lists',
      'workflows',
      'channels',
      'exchanges',
      'invites',
    ],
  },
  {
    id: 'communication',
    title: 'Switch',
    description: 'Switch backend module for messaging, notifications, and channel routing.',
    root: '/communication/dashboard',
    apiProvider: communicationApi,
    routes: [
      '/communication',
      '/communication/dashboard',
      '/communication/aes',
      '/communication/messages',
      '/communication/notifications',
      '/communication/notification-templates',
      '/communication/message-templates',
      '/communication/communication-channels',
      '/communication/message-logs',
      '/communication/audit-center',
      '/communication/flow-graph',
      '/communication/trace-explorer',
      '/communication/message-tester',
      '/communication/routing',
      '/communication/mapping',
    ],
    resources: ['messages', 'notifications', 'notification-templates', 'message-templates'],
  },
  {
    id: 'coding-concept',
    title: 'Coding Concept',
    description:
      'Standard terminology workspace for concept codes, metadata values, mappings, and validation lookups.',
    root: '/coding-concept/dashboard',
    apiProvider: codingConceptApi,
    routes: ['/coding-concept', '/coding-concept/dashboard'],
    resources: ['coding-concepts'],
  },
  {
    id: 'rxsoft',
    title: 'RxSoft',
    description: 'RxSoft pharmacy admin module with reporting, catalog, and operations.',
    root: '/rxsoft/dashboard',
    apiProvider: rxsoftApi,
    routes: [
      '/rxsoft/dashboard',
      '/dashboard/sales',
      '/dashboard/purchases',
      '/rxsoft',
      '/rxsoft/products',
      '/rxsoft/items',
      '/rxsoft/items/create',
      '/rxsoft/categories',
      '/rxsoft/uoms',
      '/rxsoft/pharmaceutics',
      '/rxsoft/drug-components',
      '/rxsoft/manufacturers',
      '/rxsoft/price-lists',
      '/rxsoft/price-list-items',
      '/rxsoft/users',
      '/rxsoft/customers',
      '/rxsoft/suppliers',
      '/rxsoft/roles',
      '/rxsoft/sales',
      '/rxsoft/receivables',
      '/rxsoft/purchases',
      '/rxsoft/payment-methods',
      '/rxsoft/inventory',
      '/rxsoft/branches',
      '/rxsoft/settings',
      '/rxsoft/gl-accounts',
      '/rxsoft/journals',
      '/rxsoft/journal-entries',
      '/rxsoft/journal-entry-lines',
      '/rxsoft/reports/trial-balance',
      '/rxsoft/reports/balance-sheet',
      '/rxsoft/reports/income-statement',
      '/rxsoft/organizations',
    ],
    resources: [
      'products',
      'categories',
      'uoms',
      'uom-category',
      'pharmaceutics',
      'drug-components',
      'manufacturers',
      'price-lists',
      'price-list-items',
      'users',
      'customers',
      'suppliers',
      'roles',
      'sales',
      'receivables',
      'purchases',
      'payment-methods',
      'inventory',
      'stock-balances',
      'stock-movements',
      'stock-locations',
      'branches',
      'settings',
      'gl-accounts',
      'journals',
      'journal-entries',
      'journal-entry-lines',
      'trial-balance',
      'balance-sheet',
      'income-statement',
      'organizations',
      'audit-logs',
    ],
  },
  {
    id: 'lis',
    title: 'LIS',
    description: 'Laboratory Information System workspace backed by the standalone LIS service.',
    root: '/lis/dashboard',
    apiProvider: lisApi,
    routes: ['/lis', '/lis/dashboard'],
    resources: [
      'lis-test-definitions',
      'lis-reference-ranges',
      'lis-rejection-reasons',
      'lis-programs',
      'lis-location-types',
      'lis-locations',
      'lis-attribute-definitions',
      'lis-sample-types',
      'lis-priorities',
      'lis-test-categories',
      'lis-loinc',
    ],
  },
  {
    id: 'emr',
    title: 'EMR',
    description:
      'Electronic Medical Record: appointments, visits, encounters, dynamic forms and clinical requests.',
    root: '/emr/dashboard',
    apiProvider: emrApi,
    routes: [
      '/emr',
      '/emr/dashboard',
      '/emr/appointments',
      '/emr/patients',
      '/emr/visits',
      '/emr/encounters',
      '/emr/forms',
      '/emr/requests',
    ],
    resources: [
      'emr-patients',
      'emr-appointments',
      'emr-visits',
      'emr-encounters',
      'emr-form-definitions',
      'emr-requests',
    ],
  },
  {
    id: 'admin',
    title: 'Admin Console',
    description: 'Full shadcn-admin workspace with the normal menu and shared controls.',
    root: '/admin/dashboard',
    apiProvider: rxsoftApi,
    routes: ['/admin/dashboard'],
    resources: [],
  },
  {
    id: 'website',
    title: 'Website Console',
    description:
      'Website content management: eHealthwares products, services, sections and site settings.',
    root: '/website/dashboard',
    apiProvider: rxsoftApi,
    routes: [
      '/website/dashboard',
      '/rxsoft/ehealthwares-hero-slides',
      '/rxsoft/ehealthwares-products',
      '/rxsoft/ehealthwares-services',
      '/rxsoft/ehealthwares-categories',
      '/rxsoft/ehealthwares-articles',
      '/rxsoft/ehealthwares-testimonials',
      '/rxsoft/ehealthwares-partners',
      '/rxsoft/ehealthwares-team',
      '/rxsoft/ehealthwares-investors',
      '/rxsoft/ehealthwares-careers',
      '/rxsoft/ehealthwares-sections',
      '/rxsoft/ehealthwares-settings',
      '/rxsoft/ehealthwares-contact-submissions',
    ],
    resources: [
      'ehealthwares-hero-slides',
      'ehealthwares-products',
      'ehealthwares-services',
      'ehealthwares-categories',
      'ehealthwares-articles',
      'ehealthwares-testimonials',
      'ehealthwares-partners',
      'ehealthwares-team',
      'ehealthwares-investors',
      'ehealthwares-careers',
      'ehealthwares-sections',
      'ehealthwares-settings',
      'ehealthwares-contact-submissions',
    ],
  },
];

export const moduleMap: Record<ModuleId, ModuleDefinition> = {
  conversation: modules[0],
  communication: modules[1],
  'coding-concept': modules[2],
  rxsoft: modules[3],
  lis: modules[4],
  emr: modules[5],
  admin: modules[6],
  website: modules[7],
};

export const defaultModule: ModuleId = 'rxsoft';

export function getModuleRoot(moduleId: ModuleId) {
  return moduleMap[moduleId]?.root ?? '/';
}
