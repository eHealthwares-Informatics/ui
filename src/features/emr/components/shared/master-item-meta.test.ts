import { describe, expect, it } from 'vitest';
import { buildItemName, buildReferenceCode } from './master-item-meta';

describe('buildReferenceCode', () => {
  it('prefixes the kind and prefers the code over the id', () => {
    expect(
      buildReferenceCode({ kind: 'STOCK_ITEM', code: 'PMC-001', id: 'uuid-1' }),
    ).toBe('STOCK_ITEM:PMC-001');
    expect(
      buildReferenceCode({ kind: 'GENERIC_PRODUCT', code: 'GENP-1', id: 'gp-1' }),
    ).toBe('GENERIC_PRODUCT:GENP-1');
    expect(
      buildReferenceCode({ kind: 'GENERIC_DRUG', code: 'NDF-9', id: 'gd-1' }),
    ).toBe('GENERIC_DRUG:NDF-9');
    expect(
      buildReferenceCode({ kind: 'LOINC_TEST', code: '15074-8', id: 'loinc-1' }),
    ).toBe('LOINC_TEST:15074-8');
  });

  it('falls back to the id when the entry has no code', () => {
    expect(
      buildReferenceCode({ kind: 'GENERIC_DRUG', id: 'gd-only-id' }),
    ).toBe('GENERIC_DRUG:gd-only-id');
  });
});

describe('buildItemName', () => {
  it('concatenates the label and code', () => {
    expect(buildItemName('Paracetamol 500mg', 'PMC-001')).toBe(
      'Paracetamol 500mg — PMC-001',
    );
  });
});
