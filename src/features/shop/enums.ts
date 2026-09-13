export enum InventoryTransactionType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN_IN = 'RETURN_IN',
  RETURN_OUT = 'RETURN_OUT',
}

export enum PurchaseStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  PARTIALLY_RECEIVED = 'Partially Received',
  RECEIVED = 'Received',
  CANCELLED = 'Cancelled',
}

export enum TaxMode {
  INCLUSIVE = 'INCLUSIVE',
  EXCLUSIVE = 'EXCLUSIVE',
}

export enum PriceType {
  RETAIL = 'Retail',
  WHOLESALE = 'Wholesale',
  CUSTOMER = 'Customer',
  PROMO = 'Promotional',
}
