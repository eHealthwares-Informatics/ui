/** Child-order summary attached by the backend's attachOrderChildren enrichment. */
export interface OrderChildRow {
  id: string;
  orderNumber: string;
  orderStatus: string;
  createdAt: string;
  totalAmount: number;
  totalItems: number;
  reconciledItems: number;
  unreconciledItems: number;
  /** Raw order lines carried so child rows support the reconcile action. */
  items?: Array<Record<string, any>>;
}

/**
 * Expands each parent row's `childOrders` into flattened child rows placed
 * directly after it in the table. Child rows inherit enough of the parent
 * (org, payment method) to render correctly but carry the child's own number,
 * status, totals and raw items, so all row actions (view, reconcile, status
 * change) operate on the real child order. `_isChildRow` marks them for
 * styling/filtering; they are only display duplicates — the canonical child
 * row still exists in the list on its own page.
 */
export function flattenChildRows<T extends Record<string, any>>(
  rows: T[],
): Array<T | (T & { _isChildRow: boolean; _parentId: string; _child: OrderChildRow })> {
  const out: any[] = [];
  for (const row of rows ?? []) {
    out.push(row);
    const children: OrderChildRow[] = Array.isArray(row?.childOrders) ? row.childOrders : [];
    for (const child of children) {
      out.push({
        ...row,
        id: child.id,
        orderNumber: child.orderNumber,
        orderStatus: child.orderStatus,
        createdAt: child.createdAt,
        totalAmount: child.totalAmount,
        items: child.items ?? [],
        // Child rows are their own little world: no parent leftovers leak in.
        childOrders: [],
        saleId: null,
        sale: null,
        parentOrderId: row.id,
        parentOrderNumber: row.orderNumber,
        _isChildRow: true,
        _parentId: row.id,
        _child: child,
      });
    }
  }
  return out;
}
