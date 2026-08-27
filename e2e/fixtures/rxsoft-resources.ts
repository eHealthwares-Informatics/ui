/**
 * RxSoft generic-CRUD resource registry.
 *
 * Every entry drives one `describe` block in crud-suite/run-crud.spec.ts.
 * Config is derived from the actual `ModelConfig` objects under
 * `src/features/rxsoft/pages` — the DataPageShell renders these
 * pages uniformly, so a single parameterized runner covers them.
 *
 * Capabilities are intentionally conservative:
 *  - `canCreate` only when the create modal is filled by plain text/select
 *    fields (no required async-selects, no tab-group wizards).
 *  - `canEdit` only when the page wires `buildUpdatePayload` into the modal
 *    (price-lists, roles) rather than navigating to an edit route.
 *  - `canDelete` only exercised when we also created the record, so we never
 *    risk removing seeded data.
 *  - `hasExport` mirrors `config.canExport && config.csvEndpoint`.
 */

export type CrudFieldSpec =
  | { label: string; kind?: 'text' | 'textarea'; value: (token: string) => string }
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
  {
    id: 'items',
    title: 'Items',
    route: '/rxsoft/items',
    endpoint: '/items',
    nameLabel: 'Item Name (Brand/Variety)',
    uniquePrefix: 'E2E Item',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
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
    canDelete: false, // we never create categories, so we never delete them
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
    canDelete: true,
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
    canDelete: false, // warehouse deletion depends on row FK state; not exercised here
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
      { label: 'Method Type', value: () => 'cash' },
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
      { label: 'Permission Codes (comma-separated)', value: () => 'products:read' },
    ],
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: true,
    canEdit: true,
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
    id: 'inventory',
    title: 'Inventory',
    route: '/rxsoft/inventory',
    endpoint: '/inventory/stock-balances',
    nameLabel: 'Item',
    uniquePrefix: 'E2E Inventory',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
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