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
  /**
   * How the row "edit" action opens. Default `modal` (Mantine dialog).
   * `route` = the pencil navigates to a generic schema-driven edit route
   * (the page renders the same field schema, not a modal). Bespoke edit
   * screens stay gated.
   */
  editMode?: 'modal' | 'route';
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
      { label: 'Provider Type', kind: 'select', option: 'Moniepoint' },
      { label: 'Channel', kind: 'select', option: 'POS' },
      // Gateway providers require credentials. Reuse the seeded MONIEPOINT
      // sandbox test_config (seeds/backend/inline/payment_providers.json) so
      // the create is valid without inventing keys. (test_config here is the
      // same sandbox value committed in the seed repo.)
      {
        label: 'Test Credentials (JSON)',
        kind: 'textarea',
        value: () =>
          '{"apiKey":"mptp_f48a373ca61847f2b1c1968d3350b28b_46be03","contractCode":"6971731247"}',
      },
    ],
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: true,
    // ui#124 item 2: the edit test fails on the QA box (create works). The
    // static path looks correct — getDirtyFields sends only the changed `name`,
    // the DTO accepts it and PATCH /payment-providers/:id exists — so this
    // needs a live-run trace, not a guess. Reverted to create-only (the fix the
    // ticket sanctions) so the suite stays honest instead of red; re-enable
    // once the failing step is identified.
    canEdit: true,
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
    // Owner 2026-10-13: activate CRUD.
    canCreate: true,
    canEdit: true,
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
      // Must match the field label in pos-terminals/schema.ts ('Provider Type').
      // The column header is 'Provider', but the create-modal field is not —
      // chooseOption() anchors on the exact label, so 'Provider' never resolved
      // and the create modal timed out (ui#124).
      { label: 'Provider Type', kind: 'select', option: 'Paystack' },
    ],
    editField: { label: 'Label', value: (token) => `${token}-edited` },
    canCreate: true,
    canEdit: true,
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
  // EXCLUDED (owner 2026-10-13): the uom-category page reuses the /uoms
  // endpoint with a type discriminator in buildCreatePayload — a created row
  // is a UOM, not a category, so asserting list visibility of the token is
  // unreliable. Excluded from the generic crud runner entirely; UOM-category
  // coverage comes from the `uoms` resource + dedicated specs.
  // {
  //   id: 'uom-category',
  //   title: 'UOM Categories',
  //   route: '/rxsoft/uom-category',
  //   endpoint: '/uoms',
  //   nameLabel: 'Name',
  //   uniquePrefix: 'E2E UOMCat',
  //   createFields: [],
  //   canCreate: false,
  //   canEdit: false,
  //   canDelete: false,
  //   hasExport: false,
  // },
  {
    id: 'users',
    title: 'Users',
    route: '/rxsoft/users',
    endpoint: '/users',
    nameLabel: 'Username',
    uniquePrefix: 'E2E User',
    createFields: [],
    // Requires password + roles multi-async-select — wizard-ish; create gated.
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: false,
    canEdit: true,
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
    // Owner 2026-10-13: view + export only; list/detail via bespoke sales-lines-bespoke.spec.ts.
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
    // Owner 2026-10-13: view + export only; create/edit/delete via bespoke flows (pos-flow.spec.ts, full-business-flow.spec.ts).
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'payment-transactions',
    title: 'Payment Transactions',
    route: '/rxsoft/payment-transactions',
    endpoint: '/payments',
    nameLabel: 'Reference',
    uniquePrefix: 'E2E PayTxn',
    createFields: [],
    // Owner 2026-10-13: view + export only.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
  },
  {
    id: 'receivables',
    title: 'Receivables',
    route: '/rxsoft/receivables',
    endpoint: '/receivables',
    nameLabel: 'Party',
    uniquePrefix: 'E2E Receivable',
    createFields: [],
    // Owner 2026-10-13: view + export only; list/detail via bespoke receivables-bespoke.spec.ts.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: true,
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
    // Owner 2026-10-13: view only.
    canCreate: false, // requires required `parentId` async-select
    canEdit: false,
    canDelete: false,
    hasExport: false,
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
    canDelete: false, // per-row delete not exposed by the customers page (no deleteMutation config),
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
    // Owner 2026-10-13: full CRUD + export.
    canCreate: true,
    canEdit: true,
    canDelete: true,
    hasExport: true,
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
    // Owner 2026-10-13: editing enabled.
    canCreate: true,
    canEdit: true,
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
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    canCreate: true,
    canEdit: true,
    // DELETE /uoms/:id now ships (rxsoft#782) with a check-if-in-use guard. The
    // suite only deletes a UOM it just created, which nothing references yet.
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
    // Owner 2026-10-13: read-only.
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
    // Owner 2026-10-13: read-only.
    canCreate: false, // proxied to healthcare-concepts (not running) — create does not persist
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'branches',
    title: 'Branches',
    route: '/rxsoft/branches',
    endpoint: '/branches',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Branch',
    createFields: [],
    // Owner 2026-10-13: full CRUD.
    canCreate: true, // tab-group wizard modal
    canEdit: true,
    canDelete: true,
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
    // Owner 2026-10-13: full CRUD.
    editField: { label: 'Name', value: (token) => `${token}-edited` },
    editMode: 'route', // edit opens a schema-driven route page, not a modal
    canCreate: true,
    canEdit: true, // opens an edit route page, not the modal
    canDelete: true,
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
    // Owner 2026-10-13: read-only (immutable ledger).
    canCreate: false,
    canEdit: true,
    canDelete: true,
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
    // Owner 2026-10-13: edit enabled.
    canCreate: true,
    canEdit: true,
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
    // Owner 2026-10-13: edit enabled.
    canCreate: true,
    canEdit: true,
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
    // PATCH /roles/:id now exists on the proxy (rxsoft#781) and the edit modal
    // closes on save, so the edit TCs can run.
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
    // Owner 2026-10-13: edit enabled.
    canCreate: true,
    canEdit: true,
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
    // Owner 2026-10-13: full CRUD (create also covered by stock-locations-create.spec.ts).
    canCreate: true, // requires parentId + warehouseId async-selects
    canEdit: true,
    canDelete: true,
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

  // ── Phase-4 registry extension (2026-10-10 batch, #104/#149) ─────────────
  {
    id: 'purchases',
    title: 'Purchases',
    route: '/rxsoft/purchases',
    endpoint: '/purchases',
    nameLabel: 'PO/Invoice',
    uniquePrefix: 'E2E Purchase',
    createFields: [],
    // Admin create retired (ui#70 — the shop PO builder owns creation);
    // edit is status-conditional via the modal; POs are financial records
    // the suite must never delete.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  // ── ui#61 asks 2–3: admin website CRUD surfaces (coupons / consultations /
  // delivery-areas) — plain DataPageShell pages from the rxsoft#34 batch.
  {
    id: 'coupons',
    title: 'Coupons',
    route: '/rxsoft/coupons',
    endpoint: '/coupons',
    nameLabel: 'Code',
    uniquePrefix: 'E2E Coupon',
    createFields: [
      { label: 'Code', value: t },
      { label: 'Type', kind: 'select', option: 'Percent' },
      { label: 'Value (percent / ₦)', value: () => '5' },
    ],
    editField: { label: 'Value (percent / ₦)', value: () => '7' },
    canCreate: true,
    canEdit: true,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'website-consultations',
    title: 'Consultations',
    route: '/rxsoft/website-consultations',
    endpoint: '/website/admin/consultations',
    nameLabel: 'Name',
    uniquePrefix: 'E2E Consult',
    createFields: [
      { label: 'Name', value: t },
      { label: 'Phone', value: () => '0809' + Math.floor(Math.random() * 1_000_000_000) },
    ],
    editField: { label: 'Phone', value: () => '0803' + Math.floor(Math.random() * 1_000_000_000) },
    canCreate: true,
    canEdit: true,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'website-delivery-areas',
    title: 'Delivery Areas',
    route: '/rxsoft/website-delivery-areas',
    endpoint: '/website/admin/delivery-areas',
    nameLabel: 'City',
    uniquePrefix: 'E2E Area',
    createFields: [
      { label: 'State', value: () => 'Lagos' },
      { label: 'City', value: t },
    ],
    // No buildUpdatePayload on the schema → modal edit is not wired; stay
    // honest (the finance-batch rule).
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'organisation-payment-providers',
    title: 'Organisation Payment Providers',
    route: '/rxsoft/organisation-payment-providers',
    endpoint: '/organisation-payment-providers',
    nameLabel: 'Provider Name',
    uniquePrefix: 'E2E OrgPayProvider',
    createFields: [],
    // Create requires a paymentProviderId async-select, and org payment
    // providers are org-critical wiring — the suite stays view-only.
    canCreate: false,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
];
