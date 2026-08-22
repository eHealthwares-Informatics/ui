export function printPo(po: {
  purchaseOrderNumber?: string;
  supplierName?: string;
  warehouseName?: string;
  orderDate?: string;
  expectedDate?: string | null;
  lines: Array<{
    itemCode?: string;
    itemName?: string;
    orderedQty: number;
    unitCost: number;
    lineTotal: number;
  }>;
  totalCost: number;
}) {
  const linesHtml = po.lines
    .map(
      (l) => `
    <tr>
      <td>${l.itemCode || ''} ${l.itemName || ''}</td>
      <td style="text-align:right">${l.orderedQty}</td>
      <td style="text-align:right">${l.unitCost.toFixed(2)}</td>
      <td style="text-align:right">${l.lineTotal.toFixed(2)}</td>
    </tr>`,
    )
    .join('');

  const win = window.open('', '_blank');
  if (!win) {return;}
  win.document.write(`
    <html>
    <head>
      <title>Purchase Order - ${po.purchaseOrderNumber || 'N/A'}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .info { margin-bottom: 12px; }
        .info div { margin-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
        th { background: #eee; }
        .total { font-weight: bold; margin-top: 8px; text-align: right; }
        @media print { body { margin: 0; padding: 12px; } }
      </style>
    </head>
    <body>
      <h1>PURCHASE ORDER</h1>
      <div class="info">
        <div><strong>PO#:</strong> ${po.purchaseOrderNumber || 'N/A'}</div>
        <div><strong>Supplier:</strong> ${po.supplierName || 'N/A'}</div>
        <div><strong>Warehouse:</strong> ${po.warehouseName || 'N/A'}</div>
        <div><strong>Order Date:</strong> ${po.orderDate || 'N/A'}</div>
        <div><strong>Expected:</strong> ${po.expectedDate || 'N/A'}</div>
      </div>
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr>
        </thead>
        <tbody>${linesHtml}</tbody>
      </table>
      <div class="total">Total: ₦${po.totalCost.toFixed(2)}</div>
      <script>window.print();window.close();</script>
    </body>
    </html>
  `);
  win.document.close();
}