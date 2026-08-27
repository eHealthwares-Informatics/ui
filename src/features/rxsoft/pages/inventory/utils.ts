export type UomFactorInfo = {
  id?: string;
  name?: string;
  code?: string | null;
  uomType?: 'reference' | 'bigger' | 'smaller' | string | null;
  factor?: number | null;
};

// Multiplier that converts 1 unit of `uom` into category-reference units.
export function uomEffectiveFactor(uom?: UomFactorInfo | null): number {
  if (!uom) {
    return 1;
  }
  const factor = Number(uom.factor ?? 1);
  if (!Number.isFinite(factor) || factor <= 0) {
    return 1;
  }
  return uom.uomType === 'smaller' ? 1 / factor : factor;
}

// Converts `quantity` from `fromUom` into `baseUom` units (reference-relative).
export function uomToBaseQuantity(
  quantity: number,
  fromUom?: UomFactorInfo | null,
  baseUom?: UomFactorInfo | null,
): number {
  if (!fromUom || !baseUom || !Number.isFinite(quantity)) {
    return quantity;
  }
  return Number(
    ((quantity * uomEffectiveFactor(fromUom)) / uomEffectiveFactor(baseUom)).toFixed(4),
  );
}