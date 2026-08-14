import type { Column, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import type { ModelConfig } from '@/features/shared/model-schema';
import { unwrapSelectValue } from '@/features/shared/payload-utils';
import { referenceRangesConfig } from '../reference-ranges/schema';

const columns: Column[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  {
    key: 'testSectionId',
    label: 'Section',
    render: (row: any) => row.testSection?.name ?? row.testSectionId,
  },
  { key: 'active', label: 'Active' },
];

const tabGroups: TabGroup[] = [
  {
    title: 'Test Definition',
    value: 'test-def',
    fieldGroups: [
      {
        title: 'Basic Information',
        fields: [
          {
            name: 'code',
            label: 'Code',
            type: 'text',
            required: true,
            col: 4,
            generateCode: { scope: 'test-definitions' },
          },
          { name: 'name', label: 'Name', type: 'text', required: true, col: 8 },
          { name: 'description', label: 'Description', type: 'text', col: 12 },
          { name: 'active', label: 'Active', type: 'switch', col: 3 },
        ],
      },
      {
        title: 'Classification',
        fields: [
          {
            name: 'testSectionId',
            label: 'Test Section',
            type: 'async-select',
            searchParam: { endpoint: '/lis/test-sections', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          {
            name: 'testCategoryId',
            label: 'Test Category',
            type: 'async-select',
            searchParam: { endpoint: '/lis/test-categories', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          {
            name: 'methodId',
            label: 'Method',
            type: 'async-select',
            searchParam: { endpoint: '/lis/methods', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          {
            name: 'sampleTypeId',
            label: 'Sample Type',
            type: 'async-select',
            searchParam: { endpoint: '/lis/sample-types', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          {
            name: 'programId',
            label: 'Program',
            type: 'async-select',
            searchParam: { endpoint: '/lis/programs', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
        ],
      },
      {
        title: 'Result Configuration',
        fields: [
          {
            name: 'unitId',
            label: 'Unit',
            type: 'async-select',
            searchParam: { endpoint: '/lis/uoms', valueKey: 'id', labelKey: 'name' },
            col: 4,
          },
          {
            name: 'loincIds',
            label: 'LOINC Codes',
            type: 'multi-async-select',
            searchParam: { endpoint: '/lis/loinc', valueKey: 'id', labelKey: 'code' },
            col: 8,
          },
          {
            name: 'resultType',
            label: 'Result Type',
            type: 'select',
            options: [
              { value: 'NUMERIC', label: 'Numeric' },
              { value: 'TEXT', label: 'Text' },
              { value: 'DICTIONARY', label: 'Dictionary' },
              { value: 'BOOLEAN', label: 'Boolean' },
              { value: 'DATE', label: 'Date' },
              { value: 'RICH_TEXT', label: 'Rich Text' },
              { value: 'ATTACHMENT', label: 'Attachment/Image' },
              { value: 'TABLE', label: 'Table' },
              { value: 'CALCULATED', label: 'Calculated' },
            ],
            col: 3,
          },
          { name: 'reportable', label: 'Reportable', type: 'switch', col: 3 },
          { name: 'validationRules', label: 'Validation Rules', type: 'json', col: 12 },
        ],
      },
    ],
  },
  {
    title: 'Reference Ranges',
    value: 'ref-ranges',
    fieldGroups: [
      {
        title: 'Age- and Gender-Specific Ranges',
        fields: [
          {
            name: 'referenceRanges',
            label: 'Reference Ranges',
            type: 'accordion-array',
            col: 12,
            relationshipId: 'testId',
            itemLabelKey: 'alias',
            itemRender: (item: any) =>
              `${item.alias ?? '?'}: ${item.gender ?? 'DEFAULT'} (${item.minAge ?? 0}-${item.maxAge ?? '*'} days)`,
            itemEditConfig: referenceRangesConfig,
          },
        ],
      },
    ],
  },
];

function buildFormState(row: Record<string, unknown>) {
  const state = { ...row };

  if (row.category) {
    const cat = row.category as Record<string, unknown>;
    state.testCategoryId = { value: cat.id, label: cat.name };
  }
  if (row.uom) {
    const u = row.uom as Record<string, unknown>;
    state.unitId = { value: u.id, label: u.name };
  }
  if (row.loinc) {
    const l = row.loinc as Record<string, unknown>;
    state.loincIds = [{ value: l.id, label: l.code ?? l.name }];
  }
  if (row.sampleTypes) {
    const sts = row.sampleTypes as Array<Record<string, unknown>>;
    state.sampleTypeId = sts.length ? { value: sts[0].id, label: sts[0].name } : undefined;
  }
  if (row.programs) {
    const ps = row.programs as Array<Record<string, unknown>>;
    state.programId = ps.length ? { value: ps[0].id, label: ps[0].name } : undefined;
  }
  if (row.method) {
    const m = row.method as Record<string, unknown>;
    state.methodId = { value: m.id, label: m.name };
  }
  if (row.testSection) {
    const ts = row.testSection as Record<string, unknown>;
    state.testSectionId = { value: ts.id, label: ts.name };
  }

  state.referenceRanges = Array.isArray(row.referenceRanges) ? row.referenceRanges : [];

  delete state.category;
  delete state.uom;
  delete state.loinc;
  delete state.sampleTypes;
  delete state.programs;
  delete state.method;
  delete state.testSection;

  return state;
}

function toApiPayload(v: Record<string, unknown>) {
  const payload: Record<string, unknown> = { ...v };
  payload.testCategoryId = unwrapSelectValue(payload.testCategoryId);
  payload.unitId = unwrapSelectValue(payload.unitId);
  payload.methodId = unwrapSelectValue(payload.methodId);
  payload.testSectionId = unwrapSelectValue(payload.testSectionId);
  if (Array.isArray(payload.sampleTypeId)) {
    payload.sampleTypeId = payload.sampleTypeId.map(unwrapSelectValue);
  }
  if (Array.isArray(payload.programId)) {
    payload.programId = payload.programId.map(unwrapSelectValue);
  }
  if (Array.isArray(payload.loincIds)) {
    payload.loincIds = payload.loincIds.map(unwrapSelectValue);
  }
  payload.loincId = Array.isArray(payload.loincIds)
    ? payload.loincIds[0]
    : unwrapSelectValue(payload.loincIds);

  payload.categoryId = payload.testCategoryId;
  payload.uomId = payload.unitId;

  const stVal = payload.sampleTypeId;
  payload.sampleTypeIds = stVal !== undefined ? [unwrapSelectValue(stVal)] : [];
  const prVal = payload.programId;
  payload.programIds = prVal !== undefined ? [unwrapSelectValue(prVal)] : [];

  payload.referenceRanges = Array.isArray(payload.referenceRanges) ? payload.referenceRanges : [];

  delete payload.testCategoryId;
  delete payload.unitId;
  delete payload.sampleTypeId;
  delete payload.programId;
  delete payload.loincIds;
  payload.resultType = (payload.resultType as any).value;

  return payload;
}

export const testDefinitionsConfig: ModelConfig = {
  id: 'test-definitions',
  title: 'Test Definitions',
  description: 'Individual lab test definitions with LOINC, method, category, and unit mappings.',
  endpoint: '/lis/test-definitions',
  columns,
  tabGroups,
  buildCreatePayload: toApiPayload,
  buildUpdatePayload: toApiPayload,
  buildFormState,
};
