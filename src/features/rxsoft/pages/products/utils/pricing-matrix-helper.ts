/**
 * Pricing Matrix Helper Utilities
 *
 * Helper functions for pricing matrix operations:
 * - Merging price lists with existing item prices
 * - Creating row metadata
 * - Determining create vs update mutations
 */

export interface PricingMatrixRow {
  id: string; // Unique row ID
  priceListId: string; // Price list ID
  priceListName: string; // Display name from price list
  currencyCode: string; // Currency code
  unitPrice?: number; // Editable unit price
  itemId?: string; // Existing item ID (populated for updates)
  exists: boolean; // True if price item already exists
  dirty?: boolean; // Marked if unsaved changes
  error?: string; // Error message if save failed
}

export interface PriceList {
  id: string;
  name: string;
  code?: string;
  currencyCode?: string;
  description?: string;
}

export interface ItemPriceItem {
  id: string;
  priceListId: string;
  itemId: string;
  unitPrice: number;
  currencyCode?: string;
}

/**
 * Merge price lists with existing item prices into matrix rows
 *
 * @param priceLists - All available price lists
 * @param itemPriceItems - Existing prices for the item
 * @returns Array of pricing matrix rows (one per price list)
 *
 * @example
 * const rows = mergePricingLists(
 *   [{ id: '1', name: 'Retail' }, { id: '2', name: 'Wholesale' }],
 *   [{ id: 'item-1', priceListId: '1', unitPrice: 100 }]
 * )
 * // Returns:
 * // [
 * //   { id: 'matrix-1', priceListId: '1', priceListName: 'Retail', unitPrice: 100, itemId: 'item-1', exists: true },
 * //   { id: 'matrix-2', priceListId: '2', priceListName: 'Wholesale', exists: false }
 * // ]
 */

export const mergeRowToSaved = (saved: any, row: PricingMatrixRow) => ({
  ...row,
  itemId: saved?.id ?? row.itemId,
  unitPrice: Number(saved?.unitPrice ?? row.unitPrice),
  currencyCode: saved?.currencyCode ?? row.currencyCode,
  exists: true,
  dirty: false,
  error: undefined,
});

export function getRowsFromResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}
export function mergePricingLists(
  priceLists: PriceList[],
  itemPriceItems: ItemPriceItem[] = []
): PricingMatrixRow[] {
  if (!priceLists?.length) {
    return [];
  }

  // Create a map for quick lookup
  const priceMap = new Map(itemPriceItems.map((item) => [item.priceListId, item]));

  // Merge: one row per price list
  return priceLists.map((priceList, index) => {
    const existingPrice = priceMap.get(priceList.id);

    return {
      id: existingPrice ? existingPrice.id : `matrix-${priceList.id}`,
      priceListId: priceList.id,
      priceListName: priceList.name,
      currencyCode: existingPrice?.currencyCode || priceList.currencyCode || 'NGN',
      unitPrice: existingPrice?.unitPrice,
      itemId: existingPrice?.itemId,
      exists: !!existingPrice,
      dirty: false,
      error: undefined,
    };
  });
}

/**
 * Determine if a mutation should be CREATE or UPDATE
 *
 * @param row - Matrix row to evaluate
 * @returns 'create' | 'update'
 */
export function getMutationMode(row: PricingMatrixRow): 'create' | 'update' {
  return row.exists ? 'update' : 'create';
}

/**
 * Build payload for creating a new price item
 *
 * @param row - Matrix row with filled unitPrice
 * @param itemId - Item ID from form state
 * @returns Payload for POST /price-lists/items
 */
export function buildCreatePricePayload(
  row: PricingMatrixRow,
  itemId: string
): Record<string, any> {
  return {
    priceListId: row.priceListId,
    itemId,
    unitPrice: row.unitPrice,
    currencyCode: row.currencyCode,
  };
}

/**
 * Build payload for updating an existing price item
 *
 * @param row - Matrix row with updated unitPrice
 * @returns Payload for PATCH /price-lists/:id/items/:itemId
 */
export function buildUpdatePricePayload(row: PricingMatrixRow): Record<string, any> {
  return {
    unitPrice: row.unitPrice,
    currencyCode: row.currencyCode,
  };
}

/**
 * Build API endpoint for update mutation
 *
 * @param row - Matrix row with itemId
 * @returns Endpoint URL for PATCH
 */
export function buildUpdatePriceEndpoint(row: PricingMatrixRow): string {
  if (!row.itemId) {
    throw new Error('Cannot build update endpoint: missing itemId');
  }
  return `/price-lists/${row.priceListId}/items/${row.itemId}`;
}

/**
 * Validate that a row is ready to save
 *
 * @param row - Matrix row to validate
 * @returns Validation result with optional error message
 */
export function validatePricingRow(row: PricingMatrixRow): {
  valid: boolean;
  error?: string;
} {
  if (!row.priceListId) {
    return { valid: false, error: 'Price list is required' };
  }

  if (row.unitPrice === undefined || row.unitPrice === null) {
    return { valid: false, error: 'Unit price is required' };
  }

  if (typeof row.unitPrice !== 'number' || row.unitPrice < 0) {
    return { valid: false, error: 'Unit price must be a positive number' };
  }

  return { valid: true };
}

/**
 * Mark a row as dirty after inline edit
 *
 * @param rows - Current matrix rows
 * @param rowId - ID of row to mark
 * @param dirty - Dirty state
 * @returns Updated rows array
 */
export function updateRowDirtyState(
  rows: PricingMatrixRow[],
  rowId: string,
  dirty: boolean
): PricingMatrixRow[] {
  return rows.map((row) => (row.id === rowId ? { ...row, dirty } : row));
}

/**
 * Mark a row as having an error
 *
 * @param rows - Current matrix rows
 * @param rowId - ID of row with error
 * @param error - Error message (undefined to clear)
 * @returns Updated rows array
 */
export function updateRowError(
  rows: PricingMatrixRow[],
  rowId: string,
  error?: string
): PricingMatrixRow[] {
  return rows.map((row) => (row.id === rowId ? { ...row, error } : row));
}

/**
 * Update a row after successful mutation
 *
 * @param rows - Current matrix rows
 * @param rowId - ID of row to update
 * @param updates - Partial updates to apply
 * @returns Updated rows array
 */
export function updateRowAfterSave(
  rows: PricingMatrixRow[],
  rowId: string,
  updates: Partial<PricingMatrixRow>
): PricingMatrixRow[] {
  return rows.map((row) =>
    row.id === rowId ? { ...row, ...updates, dirty: false, error: undefined } : row
  );
}

export async function persistPricingRow(
  row: PricingMatrixRow,
  itemId: string,
  apiProvider: any
): Promise<PricingMatrixRow> {
  const validation = validatePricingRow(row);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const response = row.exists
    ? await apiProvider.patch(buildUpdatePriceEndpoint(row), buildUpdatePricePayload(row))
    : await apiProvider.post('/price-lists/items', buildCreatePricePayload(row, itemId));

  const saved = response.data;

  return {
    ...row,
    itemId: saved?.id ?? row.itemId,
    unitPrice: Number(saved?.unitPrice ?? row.unitPrice),
    currencyCode: saved?.currencyCode ?? row.currencyCode,
    exists: true,
    dirty: false,
    error: undefined,
  };
}

//   const saveRow = async (row: PricingMatrixRow) => {
//     const validation = validatePricingRow(row)
//     if (!validation.valid) {
//       const nextRows = rows.map((item) =>
//         item.id === row.id ? { ...item, error: validation.error } : item,
//       )
//       setRows(nextRows)
//       updateField(rowsField, nextRows, index)
//       return
//     }

//     setSavingRowId(row.id)
//     try {
//       const response = row.exists
//         ? await apiProvider.patch(buildUpdatePriceEndpoint(row), buildUpdatePricePayload(row))
//         : await apiProvider.post('/price-lists/items', buildCreatePricePayload(row, productId))

//       const saved = response.data
//       const savedRow: PricingMatrixRow = {
//         ...row,
//         itemId: saved?.id ?? row.itemId,
//         unitPrice: Number(saved?.unitPrice ?? row.unitPrice),
//         currencyCode: saved?.currencyCode ?? row.currencyCode,
//         exists: true,
//         dirty: false,
//         error: undefined,
//       }
//       const nextRows = rows.map((item) => (item.id === row.id ? savedRow : item))
//       const nextOriginalRows = originalRows.map((item) => (item.id === row.id ? savedRow : item))
//       syncRows(nextRows, nextOriginalRows)
//       notifications.show({ title: 'Pricing saved', message: `${row.priceListName} price updated`, color: 'green' })
//     } catch (err: any) {
//       const message = err?.response?.data?.message ?? err?.message ?? 'Failed to save price'
//       const nextRows = rows.map((item) =>
//         item.id === row.id ? { ...item, error: String(message) } : item,
//       )
//       setRows(nextRows)
//       updateField(rowsField, nextRows, index)
//       notifications.show({ title: 'Pricing save failed', message: String(message), color: 'red' })
//     } finally {
//       setSavingRowId(null)
//     }
//   }
