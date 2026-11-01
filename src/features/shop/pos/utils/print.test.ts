import { beforeEach, describe, expect, it, vi } from 'vitest';

const getEffectivePrintTemplate = vi.fn();
vi.mock('@/lib/print-template', async () => {
  const actual = await vi.importActual<typeof import('@/lib/print-template')>(
    '@/lib/print-template'
  );
  return { ...actual, getEffectivePrintTemplate: (...args: unknown[]) => getEffectivePrintTemplate(...args) };
});

const sendReceipt = vi.fn();
vi.mock('./printServer', () => ({
  getPrintServerUrl: () => 'http://agent.local',
  sendReceipt: (...args: unknown[]) => sendReceipt(...args),
}));

import { printA4Receipt, printInvoice, printPosReceipt } from './print';

const sale = {
  saleNumber: 'SO-1',
  customerName: 'Ada',
  items: [{ code: 'P1', name: 'Paracetamol', qty: 2, price: 500, total: 1000 }],
  subtotal: 1000,
  discount: 0,
  vat: 0,
  total: 1000,
  paidAmount: 1000,
  changeAmount: 0,
};

let written = '';

function stubWindow() {
  written = '';
  vi.stubGlobal('window', {
    open: () => ({
      document: {
        write: (html: string) => {
          written += html;
        },
        close: () => undefined,
        title: '',
      },
    }),
  });
}

beforeEach(() => {
  getEffectivePrintTemplate.mockReset();
  sendReceipt.mockReset();
  stubWindow();
});

describe('print documents', () => {
  it('falls back to the built-in layout when no template is configured', async () => {
    getEffectivePrintTemplate.mockResolvedValue(null);
    await printInvoice(sale);

    expect(written).toContain('INVOICE');
    expect(written).toContain('SO-1');
    expect(written).toContain('window.print()');
  });

  it('renders the configured template and appends the print hook', async () => {
    getEffectivePrintTemplate.mockResolvedValue({
      id: 't1',
      code: 'INV',
      name: 'Invoice',
      kind: 'invoice',
      body: '<html><body><h1>{{sale.header}}</h1><p>{{sale.total}}</p></body></html>',
    });

    await printInvoice({ ...sale, header: 'MY PHARMACY' });

    expect(getEffectivePrintTemplate).toHaveBeenCalledWith('invoice');
    expect(written).toContain('<h1>MY PHARMACY</h1>');
    expect(written).toContain('₦1000.00');
    expect(written).toContain('window.print()');
  });

  it('keeps the print-agent path ahead of the browser template for POS receipts', async () => {
    sendReceipt.mockResolvedValue(true);
    await printPosReceipt(sale);

    expect(sendReceipt).toHaveBeenCalledTimes(1);
    // The agent printed it, so no browser window was opened.
    expect(written).toBe('');
    expect(getEffectivePrintTemplate).not.toHaveBeenCalled();
  });

  it('prints the POS receipt in the browser when the agent is unavailable', async () => {
    sendReceipt.mockResolvedValue(false);
    getEffectivePrintTemplate.mockResolvedValue(null);

    await printPosReceipt(sale);

    expect(written).toContain('Receipt #SO-1');
  });

  it('prints an A4 receipt from its own template kind', async () => {
    getEffectivePrintTemplate.mockResolvedValue(null);
    await printA4Receipt(sale);

    expect(getEffectivePrintTemplate).toHaveBeenCalledWith('a4_receipt');
    expect(written).toContain('Wholesale Receipt');
  });
});
