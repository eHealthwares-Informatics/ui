export interface UomLike {
  id: string;
  name?: string;
  factor?: number;
  uomType?: string;
}

export function getUomEffectiveFactor(uom: UomLike | null | undefined): number {
  if (!uom || !uom.factor) {
    return 1;
  }
  if (uom.uomType === 'smaller') {
    return 1 / uom.factor;
  }
  return uom.factor;
}

export function convertPriceBetweenUoms(
  price: number,
  fromUom: UomLike | null | undefined,
  toUom: UomLike | null | undefined
): number {
  if (!fromUom || !toUom || fromUom.id === toUom.id) {
    return price;
  }
  const fromEff = getUomEffectiveFactor(fromUom);
  const toEff = getUomEffectiveFactor(toUom);
  if (fromEff === 0) {
    return price;
  }
  return (price * toEff) / fromEff;
}

export function convertQuantityBetweenUoms(
  quantity: number,
  fromUom: UomLike | null | undefined,
  toUom: UomLike | null | undefined
): number {
  if (!fromUom || !toUom || fromUom.id === toUom.id) {
    return quantity;
  }
  const fromEff = getUomEffectiveFactor(fromUom);
  const toEff = getUomEffectiveFactor(toUom);
  if (toEff === 0) {
    return quantity;
  }
  return (quantity * fromEff) / toEff;
}
