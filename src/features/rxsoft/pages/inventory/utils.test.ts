import { describe, expect, it } from 'vitest';
import { uomEffectiveFactor, uomToBaseQuantity } from './utils';

describe('inventory transfer UOM conversion', () => {
  it('routes smaller units through 1/factor', () => {
    expect(uomEffectiveFactor({ uomType: 'smaller', factor: 10 })).toBe(0.1);
    expect(uomEffectiveFactor({ uomType: 'bigger', factor: 10 })).toBe(10);
    expect(uomEffectiveFactor({ uomType: 'reference', factor: 1 })).toBe(1);
  });

  it('converts an entered quantity to base units', () => {
    const base = { uomType: 'reference', factor: 1 };
    expect(uomToBaseQuantity(2, { uomType: 'bigger', factor: 10 }, base)).toBe(20);
  });

  it('converts correctly when the base UOM is not factor 1', () => {
    const boxBase = { uomType: 'bigger', factor: 10 };
    // 30 halves (smaller factor 10 → 3 reference) → 0.3 boxes
    expect(uomToBaseQuantity(30, { uomType: 'smaller', factor: 10 }, boxBase)).toBe(0.3);
  });

  it('returns the input when base UOM info is missing', () => {
    expect(uomToBaseQuantity(7, { uomType: 'bigger', factor: 10 }, null)).toBe(7);
  });
});