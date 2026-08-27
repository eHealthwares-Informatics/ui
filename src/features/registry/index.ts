import type { ModelConfig } from '@/features/shared/model-schema';

export const modelRegistry: Record<string, () => Promise<{ default: ModelConfig }>> = {
  // RxSoft
  categories: () =>
    import('@/features/rxsoft/pages/categories/schema').then((m) => ({
      default: m.categoriesConfig as unknown as ModelConfig,
    })),
  items: () =>
    import('@/features/rxsoft/pages/products/types/schema').then((m) => ({
      default: m.itemsConfig as unknown as ModelConfig,
    })),
  users: () =>
    import('@/features/rxsoft/pages/users/schema').then((m) => ({
      default: m.usersConfig as unknown as ModelConfig,
    })),
  suppliers: () =>
    import('@/features/rxsoft/pages/suppliers/schema').then((m) => ({
      default: m.suppliersConfig as unknown as ModelConfig,
    })),
  customers: () =>
    import('@/features/rxsoft/pages/customers/schema').then((m) => ({
      default: m.customersConfig as unknown as ModelConfig,
    })),
  branches: () =>
    import('@/features/rxsoft/pages/branches/schema').then((m) => ({
      default: m.branchesConfig as unknown as ModelConfig,
    })),
  roles: () =>
    import('@/features/rxsoft/pages/roles/schema').then((m) => ({
      default: m.rolesConfig as unknown as ModelConfig,
    })),
  settings: () =>
    import('@/features/rxsoft/pages/settings/schema').then((m) => ({
      default: m.settingsConfig as unknown as ModelConfig,
    })),
  'price-lists': () =>
    import('@/features/rxsoft/pages/price-lists/schema').then((m) => ({
      default: m.priceListsConfig as unknown as ModelConfig,
    })),
  'price-list-items': () =>
    import('@/features/rxsoft/pages/price-list-items/schema').then((m) => ({
      default: m.priceListItemsConfig as unknown as ModelConfig,
    })),
  organizations: () =>
    import('@/features/rxsoft/pages/organizations/schema').then((m) => ({
      default: m.organizationsConfig as unknown as ModelConfig,
    })),
  'payment-methods': () =>
    import('@/features/rxsoft/pages/payment-methods/schema').then((m) => ({
      default: m.paymentMethodsConfig as unknown as ModelConfig,
    })),
  'payment-providers': () =>
    import('@/features/rxsoft/pages/payment-providers/schema').then((m) => ({
      default: m.paymentProvidersConfig as unknown as ModelConfig,
    })),
  'pos-terminals': () =>
    import('@/features/rxsoft/pages/pos-terminals/schema').then((m) => ({
      default: m.posTerminalsConfig as unknown as ModelConfig,
    })),
  'insurance-providers': () =>
    import('@/features/rxsoft/pages/insurance-providers/schema').then((m) => ({
      default: m.insuranceProvidersConfig as unknown as ModelConfig,
    })),
  manufacturers: () =>
    import('@/features/rxsoft/pages/manufacturers/schema').then((m) => ({
      default: m.manufacturersConfig as unknown as ModelConfig,
    })),
  'drug-components': () =>
    import('@/features/rxsoft/pages/drug-components/schema').then((m) => ({
      default: m.drugComponentsConfig as unknown as ModelConfig,
    })),
  sales: () =>
    import('@/features/rxsoft/pages/sales/schema').then((m) => ({
      default: m.salesConfig as unknown as ModelConfig,
    })),
  pharmaceutics: () =>
    import('@/features/rxsoft/pages/pharmaceutics/schema').then((m) => ({
      default: m.pharmaceuticsConfig as unknown as ModelConfig,
    })),
  journals: () =>
    import('@/features/rxsoft/pages/journals/schema').then((m) => ({
      default: m.journalsConfig as unknown as ModelConfig,
    })),
  'journal-entries': () =>
    import('@/features/rxsoft/pages/journal-entries/schema').then((m) => ({
      default: m.journalEntriesConfig as unknown as ModelConfig,
    })),
  'journal-entry-lines': () =>
    import('@/features/rxsoft/pages/journal-entry-lines/index').then((m) => ({
      default: (m as any).journalEntryLinesConfig as ModelConfig,
    })),
  purchases: () =>
    import('@/features/rxsoft/pages/purchases/schema').then((m) => ({
      default: m.purchasesConfig as unknown as ModelConfig,
    })),
  'audit-logs': () =>
    import('@/features/rxsoft/pages/audit-logs/schema').then((m) => ({
      default: m.auditLogsConfig as unknown as ModelConfig,
    })),
  receivables: () =>
    import('@/features/rxsoft/pages/receivables/schema').then((m) => ({
      default: m.receivablesConfig as unknown as ModelConfig,
    })),
  uoms: () =>
    import('@/features/rxsoft/pages/uoms/schema').then((m) => ({
      default: m.uomsConfig as unknown as ModelConfig,
    })),
  'uom-category': () =>
    import('@/features/rxsoft/pages/uom-category/schema').then((m) => ({
      default: m.uomCategoryConfig as unknown as ModelConfig,
    })),
  'stock-locations': () =>
    import('@/features/rxsoft/pages/stock-locations/schema').then((m) => ({
      default: m.stockLocationsConfig as unknown as ModelConfig,
    })),
  'stock-balances': () =>
    import('@/features/rxsoft/pages/inventory/schema').then((m) => ({
      default: m.stockBalancesConfig as unknown as ModelConfig,
    })),
  'stock-movements': () =>
    import('@/features/rxsoft/pages/inventory/schema').then((m) => ({
      default: m.stockMovementsConfig as unknown as ModelConfig,
    })),
  inventory: () =>
    import('@/features/rxsoft/pages/inventory/schema').then((m) => ({
      default: { ...m.stockBalancesConfig, id: 'inventory' } as ModelConfig,
    })),

  // Website
  'website-health-concerns': () =>
    import('@/features/rxsoft/pages/website-health-concerns/schema').then((m) => ({
      default: m.healthConcernsConfig as unknown as ModelConfig,
    })),
  'website-articles': () =>
    import('@/features/rxsoft/pages/website-articles/schema').then((m) => ({
      default: m.articlesConfig as unknown as ModelConfig,
    })),
  'website-prescriptions': () =>
    import('@/features/rxsoft/pages/website-prescriptions/schema').then((m) => ({
      default: m.prescriptionsConfig as unknown as ModelConfig,
    })),

  // Coding Concept
  'coding-concepts': () =>
    import('@/features/coding-concept/schema/view').then((m) => ({
      default: {
        id: 'coding-concepts',
        endpoint: '/concepts/:id',
        title: 'Coding Concept',
      } as ModelConfig,
    })),

  // Communication
  messages: () =>
    Promise.resolve({
      default: {
        id: 'messages',
        endpoint: '/messages',
        title: 'Messages',
        columns: [],
      } as ModelConfig,
    }),

  // LIS resources
  'lis-test-definitions': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('test-definitions')!),
    })),
  'lis-reference-ranges': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('reference-ranges')!),
    })),
  'lis-rejection-reasons': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('rejection-reasons')!),
    })),
  'lis-programs': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('programs')!),
    })),
  'lis-location-types': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('location-types')!),
    })),
  'lis-locations': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('locations')!),
    })),
  'lis-attribute-definitions': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('attribute-definitions')!),
    })),
  'lis-sample-types': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('sample-types')!),
    })),
  'lis-priorities': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('priorities')!),
    })),
  'lis-test-categories': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('test-categories')!),
    })),
  'lis-loinc': () =>
    import('@/features/lis/schema/resources').then((m) => ({
      default: resourceToModelConfig(m.getLisResourceByKey('loinc')!),
    })),
  questionnaires: () =>
    import('@/features/rxsoft/pages/conversation/components/conversation-page-schemas').then(
      (m) => ({
        default: m.questionnairePageSchema as unknown as ModelConfig,
      })
    ),
  'option-lists': () =>
    import('@/features/rxsoft/pages/conversation/components/conversation-page-schemas').then(
      (m) => ({
        default: m.optionListsPageSchema as unknown as ModelConfig,
      })
    ),
  workflows: () =>
    import('@/features/rxsoft/pages/conversation/components/conversation-page-schemas').then(
      (m) => ({
        default: m.workflowPageSchema as unknown as ModelConfig,
      })
    ),

  // eHealthwares website content
  'ehealthwares-products': () =>
    import('@/features/ehealthwares/pages/products/schema').then((m) => ({
      default: m.ehealthwaresProductsConfig as unknown as ModelConfig,
    })),
  'ehealthwares-services': () =>
    import('@/features/ehealthwares/pages/services/schema').then((m) => ({
      default: m.ehealthwaresServicesConfig as unknown as ModelConfig,
    })),
  'ehealthwares-testimonials': () =>
    import('@/features/ehealthwares/pages/testimonials/schema').then((m) => ({
      default: m.ehealthwaresTestimonialsConfig as unknown as ModelConfig,
    })),
  'ehealthwares-partners': () =>
    import('@/features/ehealthwares/pages/partners/schema').then((m) => ({
      default: m.ehealthwaresPartnersConfig as unknown as ModelConfig,
    })),
  'ehealthwares-team': () =>
    import('@/features/ehealthwares/pages/team/schema').then((m) => ({
      default: m.ehealthwaresTeamConfig as unknown as ModelConfig,
    })),
  'ehealthwares-hero-slides': () =>
    import('@/features/ehealthwares/pages/hero-slides/schema').then((m) => ({
      default: m.ehealthwaresHeroSlidesConfig as unknown as ModelConfig,
    })),
  'ehealthwares-categories': () =>
    import('@/features/ehealthwares/pages/categories/schema').then((m) => ({
      default: m.ehealthwaresCategoriesConfig as unknown as ModelConfig,
    })),
  'ehealthwares-articles': () =>
    import('@/features/ehealthwares/pages/articles/schema').then((m) => ({
      default: m.ehealthwaresArticlesConfig as unknown as ModelConfig,
    })),
  'ehealthwares-investors': () =>
    import('@/features/ehealthwares/pages/investors/schema').then((m) => ({
      default: m.ehealthwaresInvestorsConfig as unknown as ModelConfig,
    })),
  'ehealthwares-careers': () =>
    import('@/features/ehealthwares/pages/careers/schema').then((m) => ({
      default: m.ehealthwaresCareersConfig as unknown as ModelConfig,
    })),
  'ehealthwares-sections': () =>
    import('@/features/ehealthwares/pages/sections/schema').then((m) => ({
      default: m.ehealthwaresSectionsConfig as unknown as ModelConfig,
    })),
  'ehealthwares-settings': () =>
    import('@/features/ehealthwares/pages/settings/schema').then((m) => ({
      default: m.ehealthwaresSettingsConfig as unknown as ModelConfig,
    })),
  'ehealthwares-contact-submissions': () =>
    import('@/features/ehealthwares/pages/contact-submissions/schema').then((m) => ({
      default: m.ehealthwaresContactsConfig as unknown as ModelConfig,
    })),
};

function resourceToModelConfig(resource: {
  key: string;
  title: string;
  endpoint: string;
  columns: any[];
  tabGroups?: any[];
  createFields?: any[];
  createFieldGroups?: any[];
}): ModelConfig {
  return {
    id: resource.key,
    title: resource.title,
    endpoint: resource.endpoint,
    columns: resource.columns,
    tabGroups: resource.tabGroups,
    createFields: resource.createFields,
    createFieldGroups: resource.createFieldGroups,
    canDelete: true,
  };
}

export function getModelConfig(resourceKey: string): Promise<ModelConfig | null> {
  const loader = modelRegistry[resourceKey];
  if (!loader) {
    return Promise.resolve(null);
  }
  return loader().then((m) => m.default);
}
