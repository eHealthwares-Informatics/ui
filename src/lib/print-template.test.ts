import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/rxsoft-api', () => ({ rxsoftApi: { get: vi.fn() } }));

import { rxsoftApi } from '@/lib/rxsoft-api';
import {
  buildPrintContext,
  clearPrintTemplateCache,
  getEffectivePrintTemplate,
  renderTemplate,
  samplePrintSale,
} from './print-template';

const get = rxsoftApi.get as unknown as ReturnType<typeof vi.fn>;

describe('renderTemplate', () => {
  it('substitutes scalar tokens and leaves the rest of the document intact', () => {
    const html = renderTemplate('<h1>{{sale.header}}</h1><p>{{sale.total}}</p>', {
      values: { 'sale.header': 'DAMOREX', 'sale.total': '₦1.00' },
      blocks: {},
    });
    expect(html).toBe('<h1>DAMOREX</h1><p>₦1.00</p>');
  });

  it('escapes scalar values so customer/item text cannot inject markup', () => {
    const html = renderTemplate('<p>{{sale.customerName}}</p>', {
      values: { 'sale.customerName': '<script>alert(1)</script>' },
      blocks: {},
    });
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('injects block markup verbatim', () => {
    const html = renderTemplate('<tbody>{{items_rows}}</tbody>', {
      values: {},
      blocks: { items_rows: '<tr><td>1</td></tr>' },
    });
    expect(html).toBe('<tbody><tr><td>1</td></tr></tbody>');
  });

  it('renders unknown tokens empty rather than leaving the marker', () => {
    expect(renderTemplate('a{{nope.here}}b', { values: {}, blocks: {} })).toBe('ab');
  });
});

describe('buildPrintContext', () => {
  it('formats money and builds item/total rows', () => {
    const context = buildPrintContext(samplePrintSale(), { withPayment: true });
    expect(context.values['sale.total']).toBe('₦3510.00');
    expect(context.values['sale.customerName']).toBe('Ada Obi');
    expect(context.blocks.items_rows).toContain('Paracetamol 500mg (x10)');
    expect(context.blocks.totals_rows).toContain('TOTAL');
    expect(context.blocks.totals_rows).toContain('Change');
  });

  it('omits the payment rows when the document does not show them', () => {
    const context = buildPrintContext(samplePrintSale(), { withPayment: false });
    expect(context.blocks.totals_rows).not.toContain('Paid');
  });
});

describe('getEffectivePrintTemplate', () => {
  beforeEach(() => {
    clearPrintTemplateCache();
    get.mockReset();
  });

  it('returns the org template for the kind', async () => {
    get.mockResolvedValue({ data: { id: 't1', code: 'POS', name: 'POS', kind: 'pos_receipt', body: '<p/>' } });
    const template = await getEffectivePrintTemplate('pos_receipt');
    expect(template?.id).toBe('t1');
    expect(get).toHaveBeenCalledWith('/templates/effective', { params: { kind: 'pos_receipt' } });
  });

  it('caches the look-up for repeated prints', async () => {
    get.mockResolvedValue({ data: null });
    await getEffectivePrintTemplate('invoice');
    await getEffectivePrintTemplate('invoice');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('never throws when the API is unreachable', async () => {
    get.mockRejectedValue(new Error('offline'));
    await expect(getEffectivePrintTemplate('a4_receipt')).resolves.toBeNull();
  });
});
