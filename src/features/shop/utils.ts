import { TaxMode } from './enums';
import { LineItem } from './types';

export interface LineTotals {
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

export function round(v: number) {
  return Math.round(v * 100) / 100;
}

export function calculateLineTotals(
  line: LineItem,
  taxMode: TaxMode = TaxMode.EXCLUSIVE
): LineTotals {
  const qty = line.quantity || 0;
  const price = line.unitPrice || 0;
  const raw = qty * price;

  const discountFromPercent =
    (line.discountPercent || 0) > 0 ? (raw * (line.discountPercent || 0)) / 100 : 0;
  const discount = (line.discountAmount || 0) + discountFromPercent;

  const taxableBase = raw - discount;
  const taxPercent = line.taxPercent || 0;

  let tax = 0;
  let lineTotal = 0;

  if (taxMode === TaxMode.INCLUSIVE) {
    // Price includes tax. Extract tax portion.
    const base = taxableBase / (1 + taxPercent / 100);
    tax = taxableBase - base;
    lineTotal = taxableBase;
  } else {
    tax = (taxableBase * taxPercent) / 100;
    lineTotal = taxableBase + tax;
  }

  return {
    lineSubtotal: round(raw),
    lineDiscount: round(discount),
    lineTax: round(tax),
    lineTotal: round(lineTotal),
  };
}

export function calculateOrderTotals(
  lines: LineItem[],
  orderDiscountPercent = 0,
  orderDiscountAmount = 0,
  taxMode: TaxMode = TaxMode.EXCLUSIVE
): OrderTotals {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;

  for (const l of lines) {
    const lt = calculateLineTotals(l, taxMode);
    subtotal += lt.lineSubtotal;
    discount += lt.lineDiscount;
    tax += lt.lineTax;
  }

  const orderDiscountFromPercent =
    orderDiscountPercent > 0 ? (subtotal - discount) * (orderDiscountPercent / 100) : 0;
  const totalOrderDiscount = discount + orderDiscountAmount + orderDiscountFromPercent;

  const grandBase = subtotal - totalOrderDiscount;
  let orderTax = 0;

  if (taxMode === TaxMode.INCLUSIVE) {
    // tax already included in line totals for inclusive pricing
    orderTax = tax;
    return {
      subtotal: round(subtotal),
      discount: round(totalOrderDiscount),
      tax: round(orderTax),
      grandTotal: round(grandBase),
    };
  }

  // Exclusive: need to add tax computed per-line (already included in `tax` variable)
  orderTax = tax;
  const grandTotal = grandBase + orderTax;

  return {
    subtotal: round(subtotal),
    discount: round(totalOrderDiscount),
    tax: round(orderTax),
    grandTotal: round(grandTotal),
  };
}
