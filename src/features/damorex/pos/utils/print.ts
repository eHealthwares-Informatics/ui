export function printPosReceipt(sale: {
  saleNumber: string;
  customerName?: string;
  items: Array<{ code: string; name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  header?: string;
}) {
  const linesHtml = sale.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:center">${item.qty}</td>
      <td>${item.name}</td>
      <td style="text-align:right">₦${item.total.toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const headerText = sale.header || 'DAMOREX PHARMACY';

  const win = window.open('', '_blank');
  if (!win) {return;}
  win.document.write(`
    <html>
    <head>
      <title>Receipt - ${sale.saleNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 58mm; margin: 0 auto; padding: 8px; }
        h2 { font-size: 14px; text-align: center; margin: 4px 0; }
        .header { text-align: center; margin-bottom: 8px; }
        .header div { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 4px; text-align: left; }
        th { border-bottom: 1px dashed #000; }
        .right { text-align: right; }
        .center { text-align: center; }
        .total-row td { border-top: 1px dashed #000; font-weight: bold; }
        .footer { text-align: center; margin-top: 8px; font-size: 10px; }
        hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${headerText}</h2>
        <div>Receipt #${sale.saleNumber}</div>
        <hr>
      </div>
      <table>
        <thead>
          <tr><th class="center">Qty</th><th>Item</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>${linesHtml}</tbody>
      </table>
      <hr>
      <table>
        <tr><td>Subtotal</td><td class="right">₦${sale.subtotal.toFixed(2)}</td></tr>
        ${sale.discount ? `<tr><td>Discount</td><td class="right">-₦${sale.discount.toFixed(2)}</td></tr>` : ''}
        ${sale.vat ? `<tr><td>VAT</td><td class="right">₦${sale.vat.toFixed(2)}</td></tr>` : ''}
        <tr class="total-row"><td>TOTAL</td><td class="right">₦${sale.total.toFixed(2)}</td></tr>
        <tr><td>Paid</td><td class="right">₦${sale.paidAmount.toFixed(2)}</td></tr>
        <tr><td>Change</td><td class="right">₦${sale.changeAmount.toFixed(2)}</td></tr>
      </table>
      <div class="footer">
        <hr>
        <div>Thank you for your patronage!</div>
        <div>${new Date().toLocaleString()}</div>
      </div>
      <script>window.print();window.close();</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function printInvoice(sale: {
  saleNumber: string;
  customerName?: string;
  items: Array<{ code: string; name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  header?: string;
}) {
  const linesHtml = sale.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:center">${item.qty}</td>
      <td>${item.code || ''}</td>
      <td>${item.name}</td>
      <td style="text-align:right">₦${item.price.toFixed(2)}</td>
      <td style="text-align:right">₦${item.total.toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const headerText = sale.header || 'DAMOREX PHARMACY';

  const win = window.open('', '_blank');
  if (!win) {return;}
  win.document.write(`
    <html>
    <head>
      <title>Invoice - ${sale.saleNumber}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12px; padding: 40px; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
        .header { text-align: center; margin-bottom: 16px; }
        .header div { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals { margin-top: 12px; text-align: right; }
        .totals div { margin: 4px 0; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; }
        hr { border: none; border-top: 2px solid #000; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${headerText}</h1>
        <div><strong>INVOICE</strong></div>
        <div>Invoice #${sale.saleNumber}</div>
        <div>Customer: ${sale.customerName || 'Walk-in'}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
      </div>
      <table>
        <thead>
          <tr><th class="center">Qty</th><th>Code</th><th>Item</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
        </thead>
        <tbody>${linesHtml}</tbody>
      </table>
      <div class="totals">
        <div><strong>Subtotal:</strong> ₦${sale.subtotal.toFixed(2)}</div>
        ${sale.discount ? `<div><strong>Discount:</strong> -₦${sale.discount.toFixed(2)}</div>` : ''}
        ${sale.vat ? `<div><strong>VAT:</strong> ₦${sale.vat.toFixed(2)}</div>` : ''}
        <hr>
        <div style="font-size:14px"><strong>TOTAL: ₦${sale.total.toFixed(2)}</strong></div>
      </div>
      <div class="footer">
        <p>Thank you for your patronage!</p>
      </div>
      <script>window.print();window.close();</script>
    </body>
    </html>
  `);
  win.document.close();
}

export function printA4Receipt(sale: {
  saleNumber: string;
  customerName?: string;
  items: Array<{ code: string; name: string; qty: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  header?: string;
}) {
  const linesHtml = sale.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:center">${item.qty}</td>
      <td>${item.code || ''}</td>
      <td>${item.name}</td>
      <td style="text-align:right">₦${item.price.toFixed(2)}</td>
      <td style="text-align:right">₦${item.total.toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const headerText = sale.header || 'DAMOREX PHARMACY';

  const win = window.open('', '_blank');
  if (!win) {return;}
  win.document.write(`
    <html>
    <head>
      <title>Wholesale Receipt - ${sale.saleNumber}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12px; padding: 40px; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 4px; }
        .header { text-align: center; margin-bottom: 16px; }
        .header div { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals { margin-top: 12px; text-align: right; }
        .totals div { margin: 4px 0; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; }
        hr { border: none; border-top: 2px solid #000; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${headerText}</h1>
        <div><strong>Wholesale Receipt</strong></div>
        <div>Receipt #${sale.saleNumber}</div>
        <div>Customer: ${sale.customerName || 'Walk-in'}</div>
        <div>Date: ${new Date().toLocaleDateString()}</div>
      </div>
      <table>
        <thead>
          <tr><th class="center">Qty</th><th>Code</th><th>Item</th><th class="right">Unit Price</th><th class="right">Total</th></tr>
        </thead>
        <tbody>${linesHtml}</tbody>
      </table>
      <div class="totals">
        <div><strong>Subtotal:</strong> ₦${sale.subtotal.toFixed(2)}</div>
        ${sale.discount ? `<div><strong>Discount:</strong> -₦${sale.discount.toFixed(2)}</div>` : ''}
        ${sale.vat ? `<div><strong>VAT:</strong> ₦${sale.vat.toFixed(2)}</div>` : ''}
        <hr>
        <div style="font-size:14px"><strong>TOTAL: ₦${sale.total.toFixed(2)}</strong></div>
        <div><strong>Paid:</strong> ₦${sale.paidAmount.toFixed(2)}</div>
        <div><strong>Change:</strong> ₦${sale.changeAmount.toFixed(2)}</div>
      </div>
      <div class="footer">
        <p>Thank you for your patronage!</p>
      </div>
      <script>window.print();window.close();</script>
    </body>
    </html>
  `);
  win.document.close();
}