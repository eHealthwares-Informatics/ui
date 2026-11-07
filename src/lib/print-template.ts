import { conversationApi } from '@/lib/conversation-api';

/**
 * Client-side renderer for the org's print templates.
 *
 * The backend only stores documents (`GET /templates/effective`); this module
 * is the single renderer for both the print path and the admin preview, so a
 * template can never look different from what actually prints.
 *
 * Supported syntax (deliberately tiny — no templating dependency):
 *   `{{sale.total}}`   — scalar substitution, HTML-escaped
 *   `{{items_rows}}`   — pre-built item `<tr>` rows (trusted markup)
 *   `{{totals_rows}}`  — pre-built totals `<tr>` rows (trusted markup)
 */

export type PrintTemplateKind =
  | 'pos_receipt'
  | 'a4_receipt'
  | 'invoice'
  | 'labresult'
  | 'appointment_notification'
  | 'appointment_reschedule'
  | 'test_result_accepted'
  | 'test_result_completed'
  | 'appointment_checkin'
  | 'appointment_checkout';

export type PrintTemplateRecord = {
  id: string;
  code: string;
  name: string;
  kind: PrintTemplateKind;
  body: string;
  pageSize?: string;
};

export type PrintSale = {
  saleNumber: string;
  customerName?: string;
  items: Array<{ code?: string; name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paidAmount?: number;
  changeAmount?: number;
  header?: string;
};

export type PrintTemplateContext = {
  /** Escaped scalar values, keyed by the token name (`sale.total`). */
  values: Record<string, string>;
  /** Trusted markup blocks, keyed by the token name (`items_rows`). */
  blocks: Record<string, string>;
};

const TOKEN = /\{\{\s*([\w.]+)\s*\}\}/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Replace `{{token}}` placeholders; unknown tokens render as empty (never the raw marker). */
export function renderTemplate(body: string, context: PrintTemplateContext): string {
  return body
    .replace(TOKEN, (match, key: string) => (key in context.blocks ? context.blocks[key] : match))
    .replace(TOKEN, (_match, key: string) => escapeHtml(context.values[key] ?? ''));
}

const currency = (value: number) => `₦${value.toFixed(2)}`;

function itemsRows(items: PrintSale['items'], withCode: boolean): string {
  return items
    .map(
      (item) => `
    <tr class="item-row">
      <td class="qty" style="text-align:center">${item.qty}</td>${
        withCode ? `\n      <td class="code">${escapeHtml(item.code ?? '')}</td>` : ''
      }
      <td class="name">${escapeHtml(item.name)}</td>
      <td class="price" style="text-align:right">${currency(item.price)}</td>
      <td class="amount" style="text-align:right">${currency(item.total)}</td>
    </tr>`
    )
    .join('');
}

function totalsRows(sale: PrintSale, options: { withPayment: boolean }): string {
  const rows = [
    `<tr class="subtotal"><td>Subtotal</td><td class="right" style="text-align:right">${currency(
      sale.subtotal
    )}</td></tr>`,
    sale.discount
      ? `<tr class="discount"><td>Discount</td><td class="right" style="text-align:right">-${currency(
          sale.discount
        )}</td></tr>`
      : '',
    sale.vat
      ? `<tr class="vat"><td>VAT</td><td class="right" style="text-align:right">${currency(
          sale.vat
        )}</td></tr>`
      : '',
    `<tr class="total"><td><strong>TOTAL</strong></td><td class="right" style="text-align:right"><strong>${currency(
      sale.total
    )}</strong></td></tr>`,
    options.withPayment
      ? `<tr class="paid"><td>Paid</td><td class="right" style="text-align:right">${currency(
          sale.paidAmount ?? 0
        )}</td></tr>`
      : '',
    options.withPayment
      ? `<tr class="change"><td>Change</td><td class="right" style="text-align:right">${currency(
          sale.changeAmount ?? 0
        )}</td></tr>`
      : '',
  ];

  return rows.filter(Boolean).join('');
}

/**
 * Build the token map for a sale. Every value is pre-formatted so a template
 * only decides layout and CSS, never number formatting.
 */
export function buildPrintContext(
  sale: PrintSale,
  options: { withCode?: boolean; withPayment?: boolean } = {}
): PrintTemplateContext {
  const now = new Date();
  return {
    values: {
      'sale.number': sale.saleNumber,
      'sale.customerName': sale.customerName || 'Walk-in',
      'sale.header': sale.header || 'DAMOREX PHARMACY',
      'sale.date': now.toLocaleDateString(),
      'sale.time': now.toLocaleTimeString(),
      'sale.subtotal': currency(sale.subtotal),
      'sale.discount': currency(sale.discount),
      'sale.vat': currency(sale.vat),
      'sale.total': currency(sale.total),
      'sale.paid': currency(sale.paidAmount ?? 0),
      'sale.change': currency(sale.changeAmount ?? 0),
      'sale.currency': '₦',
    },
    blocks: {
      items_rows: itemsRows(sale.items, options.withCode ?? true),
      totals_rows: totalsRows(sale, { withPayment: options.withPayment ?? false }),
    },
  };
}

/** Sample sale used by the admin preview so the layout can be judged before use. */
export function samplePrintSale(): PrintSale {
  return {
    saleNumber: 'SO-2026-0001',
    customerName: 'Ada Obi',
    header: 'DAMOREX PHARMACY',
    items: [
      { code: 'PARA500', name: 'Paracetamol 500mg (x10)', qty: 2, price: 500, total: 1000 },
      { code: 'AMOX250', name: 'Amoxicillin 250mg capsules', qty: 1, price: 1500, total: 1500 },
      { code: 'VITC100', name: 'Vitamin C 100mg tablets', qty: 3, price: 300, total: 900 },
    ],
    subtotal: 3400,
    discount: 150,
    vat: 260,
    total: 3510,
    paidAmount: 4000,
    changeAmount: 490,
  };
}

/** Rendered preview markup for a stored template body. */
export function previewTemplateBody(kind: PrintTemplateKind, body: string): string {
  const sale = samplePrintSale();
  return renderTemplate(
    body,
    buildPrintContext(sale, {
      withCode: kind !== 'pos_receipt',
      withPayment: kind !== 'invoice',
    })
  );
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: PrintTemplateRecord | null }>();

export function clearPrintTemplateCache(): void {
  cache.clear();
}

/**
 * The org's template for a document kind, or null when nothing is configured
 * (callers then keep their built-in layout). Never throws: printing must work
 * even when the API is unreachable.
 */
export async function getEffectivePrintTemplate(
  kind: PrintTemplateKind
): Promise<PrintTemplateRecord | null> {
  const cached = cache.get(kind);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const { data } = await conversationApi.get('/templates/effective', { params: { kind } });
    const value = (data ?? null) as PrintTemplateRecord | null;
    cache.set(kind, { at: Date.now(), value });
    return value;
  } catch {
    cache.set(kind, { at: Date.now(), value: null });
    return null;
  }
}
