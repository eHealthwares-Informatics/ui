export function getColSpanClass(col: number) {
  return `md:col-span-${Math.min(col, 12)}`;
}
