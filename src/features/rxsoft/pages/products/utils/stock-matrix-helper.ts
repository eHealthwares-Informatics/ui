import { rxsoftApi } from '@/lib/rxsoft-api';

export interface StockMatrixRow {
  id: string;
  locationId: string;
  locationName: string;
  itemId?: string;
  quantityOnHand: number;
  uomId?: string;
  averageCost?: number;
  exists: boolean;
  dirty?: boolean;
  error?: string;
  _origQty?: number; // internal: tracks original qty for delta calculation
}

interface StockLocation {
  id: string;
  name: string;
  code?: string;
}

interface StockBalance {
  id: string;
  locationId: string;
  location: { id: string; name: string };
  quantityOnHand: number;
  averageCost: number;
}

function getRowsFromResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).data)) {
    return (payload as any).data as T[];
  }
  return [];
}

export async function loadStockMatrix(itemId?: string): Promise<StockMatrixRow[]> {
  const [locationsResp, balancesResp] = await Promise.all([
    rxsoftApi.get('/stock-locations', { params: { isActive: true, limit: 100 } }),
    itemId
      ? rxsoftApi.get('/inventory/stock-balances', { params: { itemId, limit: 100 } })
      : Promise.resolve({ data: { data: [] } }),
  ]);

  const locations: StockLocation[] = getRowsFromResponse<StockLocation>(locationsResp.data);
  const balances: StockBalance[] = getRowsFromResponse<StockBalance>(balancesResp.data);
  const balanceMap = new Map(balances.map((b) => [b.locationId, b]));

  return locations.map((loc) => {
    const existing = balanceMap.get(loc.id);
    const qty = existing?.quantityOnHand ?? 0;
    return {
      id: existing ? existing.id : `matrix-${loc.id}`,
      locationId: loc.id,
      locationName: loc.name,
      itemId,
      quantityOnHand: qty,
      averageCost: existing?.averageCost ?? 0,
      exists: !!existing,
      dirty: false,
      error: undefined,
      _origQty: qty,
    };
  });
}

export async function saveStockRow(
  row: StockMatrixRow,
  itemId: string
): Promise<{ data: StockBalance }> {
  const deltaQty = row.quantityOnHand - (row._origQty ?? 0);
  if (deltaQty === 0) {
    return {
      data: {
        id: row.id,
        locationId: row.locationId,
        location: { id: row.locationId, name: row.locationName },
        quantityOnHand: row.quantityOnHand,
        averageCost: row.averageCost ?? 0,
      } as StockBalance,
    };
  }

  const response = await rxsoftApi.post('/inventory/adjust-quantity', {
    itemId,
    locationId: row.locationId,
    deltaQuantity: deltaQty,
    uomId: row.uomId ?? null,
    reason: 'Stock entry from item setup',
  });

  return response;
}

export function mergeStockRowToSaved(saved: any, row: StockMatrixRow): StockMatrixRow {
  const qty = Number(saved?.quantityOnHand ?? row.quantityOnHand);
  return {
    ...row,
    id: saved?.id ?? row.id,
    quantityOnHand: qty,
    averageCost: Number(saved?.averageCost ?? row.averageCost ?? 0),
    exists: true,
    dirty: false,
    error: undefined,
    _origQty: qty,
  };
}

export function validateStockRow(row: StockMatrixRow): { valid: boolean; error?: string } {
  if (row.quantityOnHand == null || isNaN(row.quantityOnHand)) {
    return { valid: false, error: 'Quantity is required' };
  }
  if (row.quantityOnHand < 0) {
    return { valid: false, error: 'Quantity cannot be negative' };
  }
  return { valid: true };
}
