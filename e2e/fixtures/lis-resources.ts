/**
 * LIS generic-CRUD resource registry (phase 5).
 *
 * Mirrors `rxsoft-resources.ts`: every entry drives one `describe` block in
 * `crud-suite/run-lis-crud.spec.ts`. The LIS pages are rendered by the same
 * `DataPageShell` (`src/features/lis/pages/<resource>/index.tsx` →
 * `statusesConfig` / `LisResourcePage`), so the parameterized runner and
 * `CrudShellPage` apply unchanged.
 *
 * Capabilities are intentionally conservative (same discipline as the rxsoft
 * registry):
 *  - `canCreate` only for pages whose create modal is filled by plain
 *    text/select fields with NO tab-group wizard. Several LIS schemas
 *    (methods, uoms, panels, test-categories, …) render tab-group modals —
 *    gated to view-only until their step flows are covered bespoke.
 *  - `canEdit` false everywhere for now: no LIS page has been verified to
 *    wire `buildUpdatePayload` into an edit *modal* (vs. an edit route).
 *  - `canDelete` only exercised when we also created the record.
 *  - `hasExport` false: no LIS ModelConfig sets `canExport`/`csvEndpoint`.
 *
 * Backend scope: `lis` (rxsoft-lis-backend, http://localhost:8002, endpoint
 * prefix `/lis/...`). Auth shares the identity JWT (verified 2026-10-13).
 */

import type { RxsoftCrudResource } from './rxsoft-resources';

export type LisCrudResource = RxsoftCrudResource;

const t = (token: string) => token;

export const lisResources: LisCrudResource[] = [
  // ── Simple create modals (plain createFields) ──────────────────────────
  {
    id: 'lis-statuses',
    title: 'Statuses',
    route: '/lis/statuses',
    endpoint: '/lis/statuses',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisStatus',
    createFields: [],
    // Backend enforces domain-specific code lists (ORDER → ENTERED,
    // IN_PROGRESS, COMPLETED, CANCELLED; POST 400 otherwise — verified
    // 2026-10-13). Statuses are seeded system enums; free-form UI creates
    // are impossible. Workflow TCs (#574/#553/#560) own status transitions.
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-priorities',
    title: 'Priorities',
    route: '/lis/priorities',
    endpoint: '/lis/priorities',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisPriority',
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
    id: 'lis-location-types',
    title: 'Location Types',
    route: '/lis/location-types',
    endpoint: '/lis/location-types',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisLocationType',
    createFields: [{ label: 'Name', value: t }],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },
  {
    id: 'lis-programs',
    title: 'Programs',
    route: '/lis/programs',
    endpoint: '/lis/programs',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisProgram',
    createFields: [{ label: 'Name', value: t }],
    canCreate: true,
    canEdit: false,
    canDelete: true,
    hasExport: false,
  },

  // ── Tab-group / complex modals — view-only battery for now ─────────────
  {
    id: 'lis-methods',
    title: 'Methods',
    route: '/lis/methods',
    endpoint: '/lis/methods',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisMethod',
    createFields: [],
    canCreate: false, // tab-group modal ('Details' tab)
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-uoms',
    title: 'Units of Measurement',
    route: '/lis/uoms',
    endpoint: '/lis/uoms',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisUom',
    createFields: [],
    canCreate: false, // tab-group modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-test-categories',
    title: 'Test Categories',
    route: '/lis/test-categories',
    endpoint: '/lis/test-categories',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisTestCategory',
    createFields: [],
    canCreate: false, // tab-group modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-test-sections',
    title: 'Test Sections',
    route: '/lis/test-sections',
    endpoint: '/lis/test-sections',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisTestSection',
    createFields: [],
    canCreate: false, // tab-group modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-panels',
    title: 'Panels',
    route: '/lis/panels',
    endpoint: '/lis/panels',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisPanel',
    createFields: [],
    canCreate: false, // tab-group modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-sample-types',
    title: 'Sample Types',
    route: '/lis/sample-types',
    endpoint: '/lis/sample-types',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisSampleType',
    createFields: [],
    canCreate: false, // tab-group modal + accession rules
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-rejection-reasons',
    title: 'Rejection Reasons',
    route: '/lis/rejection-reasons',
    endpoint: '/lis/rejection-reasons',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisRejectionReason',
    createFields: [],
    canCreate: false, // tab-group modal
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-locations',
    title: 'Locations',
    route: '/lis/locations',
    endpoint: '/lis/locations',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisLocation',
    createFields: [],
    canCreate: false, // tab-group modal (details + attributes)
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-attribute-definitions',
    title: 'Attribute Definitions',
    route: '/lis/attribute-definitions',
    endpoint: '/lis/attribute-definitions',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisAttributeDef',
    createFields: [],
    canCreate: false, // tab-group modal (definition + validation)
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-reference-ranges',
    title: 'Reference Ranges',
    route: '/lis/reference-ranges',
    endpoint: '/lis/reference-ranges',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisRefRange',
    createFields: [],
    canCreate: false, // tab-group modal (criteria + values) + coverage checker
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-test-definitions',
    title: 'Test Definitions',
    route: '/lis/test-definitions',
    endpoint: '/lis/test-definitions',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisTestDef',
    createFields: [],
    canCreate: false, // multi-tab wizard (general/workflow/reference limits)
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-result-signatures',
    title: 'Result Signatures',
    route: '/lis/result-signatures',
    endpoint: '/lis/result-signatures',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisResultSignature',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-loinc',
    title: 'LOINC',
    route: '/lis/loinc',
    endpoint: '/lis/loinc',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisLoinc',
    createFields: [],
    canCreate: false, // reference catalog — view-only by design
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-qa-checklist-items',
    title: 'QA Checklist Items',
    route: '/lis/qa-checklist-items',
    endpoint: '/lis/qa-checklist-items',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisQaChecklist',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-qc-lots',
    title: 'QC Lots',
    route: '/lis/qc-lots',
    endpoint: '/lis/qc-lots',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisQcLot',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-eqa-programs',
    title: 'EQA Programs',
    route: '/lis/eqa-programs',
    endpoint: '/lis/eqa-programs',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisEqaProgram',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },

  // ── Operational entities — bespoke flows later (#574 orders workflow,
  //    #553 samples, #560 results); generic battery only for now. ──────────
  {
    id: 'lis-patients',
    title: 'Patients',
    route: '/lis/patients',
    endpoint: '/lis/patients',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisPatient',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-samples',
    title: 'Samples',
    route: '/lis/samples',
    endpoint: '/lis/samples',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisSample',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-results',
    title: 'Results',
    route: '/lis/results',
    endpoint: '/lis/results',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisResult',
    createFields: [],
    canCreate: false,
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
  {
    id: 'lis-orders',
    title: 'Orders',
    route: '/lis/orders',
    endpoint: '/lis/orders',
    nameLabel: 'Name',
    uniquePrefix: 'E2E LisOrder',
    createFields: [],
    canCreate: false, // 5-step workflow UI (#728) owns creation
    canEdit: false,
    canDelete: false,
    hasExport: false,
  },
];
