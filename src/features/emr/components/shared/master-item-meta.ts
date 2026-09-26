export type MasterItemKind = 'STOCK_ITEM' | 'GENERIC_PRODUCT' | 'GENERIC_DRUG' | 'LOINC_TEST';

export type PickerReference = {
  kind: MasterItemKind;
  code?: string;
  id: string;
};

/**
 * Stable cross-system reference for a picked catalogue entry, sent to rxsoft
 * and LIS with the request line. Format: `<KIND>:<code-or-id>` so the
 * receiving system can tell which catalogue the code belongs to.
 */
export function buildReferenceCode(item: PickerReference): string {
  return `${item.kind}:${item.code ?? item.id}`;
}

/** Human-readable line name: the catalogue label plus its code/id. */
export function buildItemName(label: string, codeOrId: string): string {
  return `${label} — ${codeOrId}`;
}
