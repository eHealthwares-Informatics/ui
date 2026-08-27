export type PurchaseOrderStatus = 'draft' | 'approved' | 'partially_received' | 'received' | 'cancelled';

export interface PoLineItem {
  id: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  orderedQty: number;
  receivedQty: number;
  uomId: string;
  uomName?: string;
  unitCost: number;
  discountPercent: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTotal: number;
  receivedSubtotal?: number;
  receivedLineTotal?: number;
  isDraft?: boolean;
  isPosted?: boolean;
  serverLineId?: string;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  invoiceNumber: string;
  supplierId: string;
  warehouseId: string;
  supplier: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
  currencyCode: string;
  orderDate: string;
  expectedDate: string | null;
  status: 'draft' | 'approved' | 'partially_received' | 'received' | 'cancelled';
  totalCost: number;
  note: string | null;
  lines: PoLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  receivedDate: string;
  note: string | null;
  lines: Array<{
    itemId: string;
    itemName?: string;
    orderedQty: number;
    receivedQty: number;
    uomId: string;
    unitCost: number;
  }>;
}

export const PO_STATUS_OPTIONS = ['draft', 'approved', 'partially_received', 'received', 'cancelled'] as const;
