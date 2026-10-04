import { describe, expect, it } from 'vitest';
import { validateFields } from '@/features/components/form/submit';
import type { Field, FieldGroup, TabGroup } from '@/features/rxsoft/types';
import { collectFields } from './payload-utils';

/**
 * collectFields is the single source of fields for form-level validation
 * (useValidatedSubmit / validateFields). Nested-state groups (matrix
 * renderers) must be excluded — their field defs are row-entry inputs held
 * in local/nested state, not top-level formState keys.
 */

const stepOneFields: Field[] = [
  {
    name: 'category',
    label: 'Category',
    type: 'async-select',
    required: true,
  },
  { name: 'name', label: 'Item Name (Brand/Variety)', required: true },
  {
    name: 'baseUom',
    label: 'Base UOM',
    type: 'async-select',
    required: true,
  },
];

const priceListMatrixGroup: FieldGroup = {
  title: 'Pricing',
  renderer: 'matrix',
  formStateField: 'priceListItems',
  rowsField: 'pricingMatrixRows',
  fields: [
    { name: 'itemId', label: 'Item Override', type: 'hidden' },
    { name: 'priceList', label: 'Price List', type: 'async-select', required: true },
    { name: 'currencyCode', label: 'Currency Code', type: 'text', required: true },
    { name: 'unitPrice', label: 'Unit Price', type: 'number', required: true },
  ],
};

const stockMatrixGroup: FieldGroup = {
  title: 'Stock Setup',
  renderer: 'matrix',
  formStateField: 'stockEntries',
  fields: [
    { name: 'itemId', label: 'Item', type: 'hidden' },
    { name: 'locationId', label: 'Location', type: 'async-select' },
    { name: 'quantityOnHand', label: 'Quantity', type: 'number', required: true },
  ],
};

const statusGroup: FieldGroup = {
  title: 'Status',
  fields: [
    { name: 'isActive', label: 'Active', type: 'switch', defaultValue: true },
    { name: 'trackExpiry', label: 'Track Expiry', type: 'switch', defaultValue: true },
  ],
};

const itemsWizardTabs: TabGroup[] = [
  { title: 'Item Details', value: 'item-details', fieldGroups: [{ fields: stepOneFields }] },
  {
    title: 'Price List',
    value: 'price-list',
    waitFor: 'id',
    fieldGroups: [priceListMatrixGroup],
  },
  {
    title: 'Stock Entries',
    value: 'stock-entries',
    waitFor: 'id',
    fieldGroups: [stockMatrixGroup],
  },
  { title: 'Status', value: 'status', fieldGroups: [statusGroup] },
];

describe('collectFields — nested matrix groups', () => {
  it('excludes matrix renderer field-group fields from form-level collection', () => {
    const fields = collectFields({ tabGroups: itemsWizardTabs });
    const names = fields.map((f) => f.name);

    expect(names).toContain('category');
    expect(names).toContain('name');
    expect(names).toContain('baseUom');
    expect(names).toContain('isActive');

    // Matrix row-entry fields must not be treated as top-level form fields
    expect(names).not.toContain('priceList');
    expect(names).not.toContain('currencyCode');
    expect(names).not.toContain('unitPrice');
    expect(names).not.toContain('quantityOnHand');
    expect(names).not.toContain('locationId');
  });

  it('still collects fields from non-matrix field groups', () => {
    const fields = collectFields({
      createFieldGroups: [
        { title: 'Basic', fields: [{ name: 'code', label: 'Code' }] },
        priceListMatrixGroup,
      ],
    });
    expect(fields.map((f) => f.name)).toEqual(['code']);
  });
});

describe('items wizard form validation (final submit)', () => {
  it('does not flag optional Price List / Stock matrix fields on last-tab submit', () => {
    const fields = collectFields({ tabGroups: itemsWizardTabs });

    // Simulated formState after Create & Continue: item details filled,
    // Price List + Stock tabs skipped empty (matrix fields absent at top level).
    const formState: Record<string, unknown> = {
      id: 'item-1',
      category: { value: 'cat-1', label: 'Medical' },
      name: 'E2E Create Item',
      baseUom: { value: 'uom-1', label: 'Unit(s)' },
      isActive: true,
      trackExpiry: true,
    };

    const errors = validateFields(fields, formState);

    expect(errors).toEqual({});
  });

  it('still blocks empty step-1 fields with labelled messages (no raw zod type noise)', () => {
    const fields = collectFields({ tabGroups: itemsWizardTabs });
    const errors = validateFields(fields, {});

    expect(errors.category).toBe('Category is required');
    expect(errors.name).toBe('Item Name (Brand/Variety) is required');
    expect(errors.baseUom).toBe('Base UOM is required');

    // Regression guard for the original bug report: raw zod type messages
    expect(Object.values(errors)).not.toContain(
      expect.stringMatching(/expected (string|number), received/i)
    );
  });
});
