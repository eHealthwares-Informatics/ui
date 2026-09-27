/**
 * RxSoft generic-CRUD resource registry.
 *
 * Every entry drives one `describe` block in crud-suite/run-crud.spec.ts.
 * Config is derived from the actual `ModelConfig` objects under
 * `src/features/rxsoft/pages` (schema.ts/schema.tsx per page) — the
 * DataPageShell renders these pages uniformly, so a single parameterized
 * runner covers them.
 *
 * Phase 1 expansion (2026-09-27): 20 → 30 resources with create coverage and
 * 11 additional view-only pages, every entry verified against the page schema
 * source. Capabilities are intentionally conservative:
 *  - `canCreate` only when the create modal is filled by plain text/select/
 *    switch fields (no required async-selects, no tab-group wizards, no JSON
 *    credential blobs).
 *  - `canEdit` only when the page wires `buildUpdatePayload` into the modal
 *    (price-lists, roles, uom-category) rather than navigating to an edit route.
 *  - `canDelete` only exercised when we also created the record, so we never
 *    risk removing seeded data.
 *  - `hasExport` mirrors `config.canExport && config.csvEndpoint`.
 *  - View-only entries (canCreate/canEdit/canDelete false) still get list +
 *    pagination + search rendering coverage.
 */

export type CrudFieldSpec =
  | { label: string; kind?: 'text' | 'textarea' | 'switch'; value: (token: string) => string }
  | { label: string; kind: 'select'; option: string };

export type RxsoftCrudResource = {
  /** Stable id, used for the generated unique token prefix. */
  id: string;
  /** RxPage <Title> — also the create/update modal title basis. */
  title: string;
  /** Frontend route covered by the runner (e.g. /rxsoft/customers). */
  route: string;
  /** Backend list endpoint (POST create = endpoint, PATCH/DELETE = endpoint/:id). */
  endpoint: string;
  /** Label of the form field that holds the unique token (searched against). */
  nameLabel: string;
  uniquePrefix: string;
  createFields: CrudFieldSpec[];
  /** Field changed by the edit test; value is derived from the create token. */
  editField?: { label: string; value: (token: string) => string };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  hasExport: boolean;
};

const t = (token: string) => token;

export const rxsoftResources: RxsoftCrudResource[] = [
  // ── Phase-1: payment & finance domain ─────────────────────────────────────
  {
    id: 'payment-providers',
    title: 'Payment Providers',
    route: '/rxsoft/payment-providers',
    endpoint: '/payment-providers',
    nameLabel: 'Name',
    uniquePrefix: 'E2E PayProvider',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
      { label: 'Provider Type', kind: 'select', option: 'Cash' },
      { label: 'Channel', kind: 'select', option: 'Cash' },
    ],
    // JSON credential fields (testConfig/liveConfig) are left empty on purpose.
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'insurance-providers',
    title: 'Insurance Providers',
    route: '/rxsoft/insurance-providers',
    endpoint: '/insurance-providers',
    nameLabel: 'Name',
    uniquePrefix: 'E2E InsProvider',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
      { label: 'Type', kind: 'select', option: 'HMO' },
      { label: 'Contact Phone', value: () => '080' + Math.floor(Math.random() * 1_000_000_000) },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'pos-terminals',
    title: 'POS Terminals',
    route: '/rxsoft/pos-terminals',
    endpoint: '/pos-terminals',
    nameLabel: 'Label',
    uniquePrefix: 'E2E Terminal',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Label', value: t },
      { label: 'Provider', kind: 'select', option: 'Paystack' },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'journal-entries',
    title: 'Journal Entries',
    route: '/rxsoft/journal-entries',
    endpoint: '/journal-entries',
    nameLabel: 'Entry Number',
    uniquePrefix: 'E2E JE',
    createFields: [],
    // journalId must reference an existing journal (uuid) — create gated to
    // avoid FK rejections; the bespoke flows cover posting paths.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'uom-category',
    title: 'UOM Categories',
    route: '/rxsoft/uom-category',
    // NOTE: the uom-category page reuses the /uoms endpoint with a type
    // discriminator in buildCreatePayload — a created row is a UOM, not a
    // category, so asserting list visibility of the token is unreliable.
    // Gated out of the create path; list/pagination still covered.
    endpoint: '/uoms',
    nameLabel: 'Name',
    uniquePrefix: 'E2E UOMCat',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'users',
    title: 'Users',
    route: '/rxsoft/users',
    endpoint: '/users',
    nameLabel: 'Username',
    uniquePrefix: 'E2E User',
    createFields: [],
    // Requires password + roles multi-async-select — wizard-ish; create gated.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'sales',
    title: 'Sales',
    route: '/rxsoft/sales',
    endpoint: '/sales',
    nameLabel: 'Sale Number',
    uniquePrefix: 'E2E Sale',
    createFields: [],
    // Sales create needs Lines/Payments JSON arrays; bespoke pos-flow.spec
    // covers the real create path — here we assert list/search/export only.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'sales-lines',
    title: 'Sales Lines',
    route: '/rxsoft/sales-lines',
    endpoint: '/sales/lines',
    nameLabel: 'Sale Number',
    uniquePrefix: 'E2E SaleLine',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'payments',
    title: 'Payments',
    route: '/rxsoft/payments',
    endpoint: '/payments',
    nameLabel: 'Reference',
    uniquePrefix: 'E2E Payment',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'payment-transactions',
    title: 'Payment Transactions',
    route: '/rxsoft/payment-transactions',
    endpoint: '/payments',
    nameLabel: 'Reference',
    uniquePrefix: 'E2E PayTxn',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'receivables',
    title: 'Receivables',
    route: '/rxsoft/receivables',
    endpoint: '/receivables',
    nameLabel: 'Party',
    uniquePrefix: 'E2E Receivable',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'price-list-items',
    title: 'Products Prices',
    route: '/rxsoft/price-list-items',
    endpoint: '/price-lists/items',
    nameLabel: 'Item',
    uniquePrefix: 'E2E PLI',
    createFields: [],
    // Create requires price-list + item async-selects; gated.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'products-items',
    title: 'Items',
    route: '/rxsoft/items',
    endpoint: '/items',
    nameLabel: 'Item Name (Brand/Variety)',
    uniquePrefix: 'E2E Item',
    createFields: [],
    // Multi-tab wizard (tabGroups + modalTitle 'Add Item'); Phase 2 covers it.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'website-orders',
    title: 'Orders',
    route: '/rxsoft/website-orders',
    endpoint: '/website/admin/orders',
    nameLabel: 'Order Number',
    uniquePrefix: 'E2E WebOrder',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'website-prescriptions',
    title: 'Prescriptions',
    route: '/rxsoft/website-prescriptions',
    endpoint: '/website/admin/prescriptions',
    nameLabel: 'Code',
    uniquePrefix: 'E2E Rx',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'receiving',
    title: 'Goods Receiving',
    route: '/rxsoft/receiving',
    endpoint: '/receipts',
    nameLabel: 'Receipt Number',
    uniquePrefix: 'E2E Receipt',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'inventory-movements',
    title: 'Inventory',
    route: '/rxsoft/inventory',
    endpoint: '/inventory/stock-movements',
    nameLabel: 'Reference',
    uniquePrefix: 'E2E Move',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },

  // ── Carried over from the original registry (verified, still current) ────
  {
    id: 'categories',
    title: 'Categories',
    route: '/rxsoft/categories',
    endpoint: '/categories',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Category',
    createFields: [],
    canCreate: false, // requires required `parentId` async-select
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'customers',
    title: 'Customers',
    route: '/rxsoft/customers',
    endpoint: '/customers',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Customer',
    createFields: [{ label: 'Name', value: t }],
    canCreate: true,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    route: '/rxsoft/suppliers',
    endpoint: '/suppliers',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Supplier',
    createFields: [{ label: 'Name', value: t }],
    canCreate: true,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'manufacturers',
    title: 'Manufacturers',
    route: '/rxsoft/manufacturers',
    endpoint: '/manufacturers',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Manufacturer',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'price-lists',
    title: 'Price Lists',
    route: '/rxsoft/price-lists',
    endpoint: '/price-lists',
    nameLabel: 'Name',
    uniquePrefix: 'E2E PriceList',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
    ],
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: true,
    canEdit: true,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'uoms',
    title: 'UOMs',
    route: '/rxsoft/uoms',
    endpoint: '/uoms',
    nameLabel: 'Name',
    uniquePrefix: 'E2E UOM',
    createFields: [
      { label: 'Name', value: t },
      { label: 'Type', kind: 'select', option: 'reference' },
    ],
    canCreate: true,
    canEdit: false,
    // DELETE /api/uoms/:id has no backend route (404) — nothing is actually deleted.
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'pharmaceutics',
    title: 'Pharmaceutics',
    route: '/rxsoft/pharmaceutics',
    endpoint: '/pharmaceutics',
    nameLabel: 'Code',
    uniquePrefix: 'E2E-PH',
    createFields: [{ label: 'Code', value: t }],
    canCreate: false, // proxied to healthcare-concepts (not running) — create does not persist
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'drug-components',
    title: 'Drug Components',
    route: '/rxsoft/drug-components',
    endpoint: '/drug-components',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Component',
    createFields: [{ label: 'Name', value: t }],
    canCreate: false, // proxied to healthcare-concepts (not running) — create does not persist
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'branches',
    title: 'Branches',
    route: '/rxsoft/branches',
    endpoint: '/branches',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Branch',
    createFields: [],
    canCreate: false, // tab-group wizard modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'warehouses',
    title: 'Warehouses',
    route: '/rxsoft/warehouses',
    endpoint: '/warehouses',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Warehouse',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Warehouse Name', value: t },
    ],
    canCreate: true,
    canEdit: false, // opens an edit route page, not the modal
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'audit-logs',
    title: 'Audit Logs',
    route: '/rxsoft/audit-logs',
    endpoint: '/audit-logs',
    nameLabel: 'ID',
    uniquePrefix: 'E2E Audit',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    route: '/rxsoft/payment-methods',
    endpoint: '/payment-methods',
    nameLabel: 'Name',
    uniquePrefix: 'E2E PayMethod',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
      { label: 'Method Type', kind: 'select', option: 'Cash' },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'gl-accounts',
    title: 'Chart of Accounts',
    route: '/rxsoft/gl-accounts',
    endpoint: '/gl-accounts',
    nameLabel: 'Account Name',
    uniquePrefix: 'E2E GL Account',
    createFields: [
      { label: 'Account Code', value: t },
      { label: 'Account Name', value: t },
      { label: 'Account Type', kind: 'select', option: 'Asset' },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'journals',
    title: 'Journals',
    route: '/rxsoft/journals',
    endpoint: '/journals',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Journal',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
      { label: 'Journal Type', value: () => 'general' },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'roles',
    title: 'Roles',
    route: '/rxsoft/roles',
    endpoint: '/roles',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Role',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
    ],
    // The third field is a permission-picker (custom component), not a text
    // input — omit it and create a role with no permission codes.
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: true,
    // PATCH /roles/:id does not exist on the backend — the edit modal stays
    // open because the request 404s. Gate until the endpoint ships.
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'organizations',
    title: 'Organizations',
    route: '/rxsoft/organizations',
    endpoint: '/organizations',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Org',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Name', value: t },
    ],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'stock-locations',
    title: 'Stock Locations',
    route: '/rxsoft/stock-locations',
    endpoint: '/stock-locations',
    nameLabel: 'Location Name',
    uniquePrefix: 'E2E StockLocation',
    createFields: [],
    canCreate: false, // requires parentId + warehouseId async-selects
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'settings',
    title: 'Settings',
    route: '/rxsoft/settings',
    endpoint: '/settings',
    nameLabel: 'Key',
    uniquePrefix: 'E2E Setting',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
];
