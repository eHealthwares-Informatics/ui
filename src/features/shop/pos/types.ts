export interface CartItem {
  id: string;
  code: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  uomId: string;
  uomName: string;
  uomFactor: number;
  lineTotal: number;
  batchNo?: string;
  expiryDate?: string;
  imageUrl?: string;
  pricingMode?: 'retail' | 'wholesale';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface SaleSession {
  id: string;
  saleCode: string;
  customer?: Customer;
  customerId?: string;
  customerName?: string;
  priceListId?: string;
  priceListName?: string;
  pricingMode: 'retail' | 'wholesale';
  discount: number;
  vatPercent: number;
  held: boolean;
  status: 'active' | 'held' | 'completed';
  paidAmount: number;
  changeAmount: number;
  createdAt: string;
  cart: CartItem[];
}

export interface PosSettings {
  tabPosition: 'top' | 'bottom';
  autoPrintReceipt: boolean;
}
