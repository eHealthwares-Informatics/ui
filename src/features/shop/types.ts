import { TaxMode, PriceType, PurchaseStatus } from './enums';

export interface LineItem {
  id?: string;
  productId: string;
  sku?: string;
  name?: string;
  quantity: number;
  uom?: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  batch?: string;
  lot?: string;
  expiryDate?: string | null;
  notes?: string;
}

export interface CreateSaleDto {
  customerId?: string;
  lines: LineItem[];
  paymentAmount?: number;
  payments?: Array<Record<string, any>>;
  orderDiscountPercent?: number;
  orderDiscountAmount?: number;
  taxMode?: TaxMode;
  priceType?: PriceType;
  metadata?: Record<string, any>;
}

export interface CreatePurchaseDto {
  supplierId?: string;
  warehouseId: string;
  lines: LineItem[];
  status?: PurchaseStatus;
  expectedDate?: string;
}
