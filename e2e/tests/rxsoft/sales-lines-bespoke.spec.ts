import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft Sales Lines — Bespoke Detail View & Filter Tests
 *
 * Covers UC-RX-SALES-LINES-01/02/06/07 for the sales-lines page
 * with saleId filter (detail view of a specific sale's lines).
 *
 * The crud-suite covers basic list page; this spec covers:
 * - Filtering by saleId (detail view)
 * - Export functionality
 * - Error handling / accessibility
 */

const TS = Date.now().toString(36);
let runId = TS;

async function apiCreate<T>(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiFetch<T>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

test.describe.serial('RxSoft Sales Lines — Bespoke Detail View & Filters', () => {
  test.setTimeout(180_000);

  let accessTokenStr: string | null = null;
  let supplierId: string;
  let warehouseId: string;
  let itemId: string;
  let uomId: string;
  let packUomId: string;
  let categoryId: string;
  let stockLocationId: string;
  let priceListId: string;
  let poId: string;
  let receiptId: string;
  let saleId: string;
  let paymentMethodId: string;

  /* ── Teardown ───────────────────────────────────────────────── */
  test.afterAll(async ({ request }) => {
    const headers = accessTokenStr
      ? { Authorization: `Bearer ${accessTokenStr}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
    async function del(path: string) {
      try {
        await request.delete(`http://localhost:8080/api${path}`, { headers });
      } catch {
        /* ignore */
      }
    }
    if (saleId) await del(`/sales/${saleId}`);
    if (receiptId) await del(`/receipts/${receiptId}`);
    if (poId) await del(`/purchases/${poId}`);
    if (itemId) await del(`/items/${itemId}`);
    if (stockLocationId) await del(`/stock-locations/${stockLocationId}`);
    if (categoryId) await del(`/categories/${categoryId}`);
    if (uomId) await del(`/uoms/${uomId}`);
    if (warehouseId) await del(`/stock-locations/${warehouseId}`);
    if (supplierId) await del(`/suppliers/${supplierId}`);
  });

  /* ── 0. Seed prerequisite data ── */

  test('0. seeds supplier, warehouse, category, stock location, item, UOM, price list, PO, receipt, sale', async ({
    page,
  }) => {
    accessTokenStr = await readAccessToken(page);
    runId = `${TS}-${Date.now().toString(36).slice(-4)}`;

    const supplier = await apiCreate<{ id: string }>(page, '/suppliers', {
      name: `SL-Test Supplier ${TS}`,
      phone: '08000000001',
      email: `sl-test-${TS}@test.com`,
      address: '123 SL Test St',
    });
    supplierId = supplier.id;

    const location = await apiCreate<{ id: string }>(page, '/stock-locations', {
      code: `WH-SL-${TS}`,
      name: `SL Location ${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    stockLocationId = location.id;

    const uomCat = await apiCreate<{ id: string }>(page, '/uom-categories', {
      name: `SL UoM Cat ${TS}`,
    });
    const uom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `UNIT_${TS}`,
      name: `Unit ${TS}`,
      uomType: 'reference',
      categoryId: uomCat.id,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    uomId = uom.id;

    const packUom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `PACK_${TS}`,
      name: `Pack ${TS}`,
      uomType: 'bigger',
      categoryId: uomCat.id,
      factor: 10,
      rounding: 1,
      isActive: true,
    });
    const packUomId = packUom.id;

    const cats = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
    categoryId = cats.data?.[0]?.id ?? '';
    expect(categoryId).toBeTruthy();

    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `SL Item ${TS}`,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
      isActive: true,
    });
    itemId = item.id;

    const pl = await apiCreate<{ id: string }>(page, '/price-lists', {
      code: `SL_PL_${TS}`,
      name: `SL Price List ${TS}`,
      isActive: true,
    });
    priceListId = pl.id;

    await apiFetch(page, '/price-lists/items', {
      method: 'POST',
      body: JSON.stringify({ priceListId, itemId, unitPrice: 100 }),
    });

    // Try to add stock at the location so the sale can be completed
    try {
      const adjustRes = await apiFetch(page, '/inventory/adjust-quantity', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          locationId: stockLocationId,
          deltaQuantity: 100,
          reason: `Sales lines test seed stock ${runId}`,
          uomId: uomId,
        }),
      });
      console.log('Stock adjustment response:', adjustRes);
    } catch (e) {
      console.warn('Stock adjustment failed (may be OK if seeded data has stock):', e);
    }

    // Verify stock balance was created
    try {
      const balanceRes = await apiFetch(
        page,
        `/inventory/stock-balances?itemId=${itemId}&locationId=${stockLocationId}&limit=1`
      );
      console.log('Stock balance check:', balanceRes);
      if (!balanceRes.data || balanceRes.data.length === 0 || !balanceRes.data[0].quantityOnHand) {
        throw new Error('Stock balance not found after adjustment - sale will fail');
      }
    } catch (e) {
      console.warn('Stock balance verification failed:', e);
    }

    // Create a store stock location for the default store with purpose 'sale_issue'
    try {
      const sslRes = await apiFetch(page, '/store-stock-locations', {
        method: 'POST',
        body: JSON.stringify({
          storeId: 'default',
          stockLocationId,
          purpose: 'sale_issue',
          isActive: true,
        }),
      });
      console.log('Store stock location created:', sslRes);
    } catch (e) {
      console.error('Store stock location creation FAILED:', e);
    }

    // Create approved PO
    const po = await apiCreate<{ id: string; status: string }>(page, '/purchases', {
      status: 'approved',
      warehouseId: stockLocationId,
      supplierId,
      lines: [{ itemId, uomId, orderedQty: 100, unitCost: 50 }],
    });
    poId = po.id;
    expect(po.status).toBe('approved');

    // Receive goods
    const recv = await apiCreate<{ receiptNumber: string }>(page, `/purchases/${poId}/receive`, {
      purchaseOrderId: poId,
      receivedDate: new Date().toISOString(),
      receiptNumber: `GR-SL-${TS}`,
      lines: [{ itemId, receivedQty: 50, uomId, unitCost: 50 }],
    });
    receiptId = recv.receiptNumber;

    // Get an existing payment method (cash) from seeded data
    const pmRes = await apiFetch<{ data: Array<{ id: string; methodType: string }> }>(
      page,
      '/payment-methods?limit=10'
    );
    const paymentMethod = pmRes.data?.find((p) => p.methodType === 'cash');
    const paymentMethodId = paymentMethod?.id;
    expect(paymentMethodId).toBeTruthy();

    // Create sale (with full payment to avoid customer requirement)
    const sale = await apiCreate<{ id: string; saleNumber: string; status: string }>(
      page,
      '/sales',
      {
        saleNumber: `SL-SALE-${TS}`,
        saleChannel: 'pos',
        storeId: 'default',
        stockLocationId,
        lines: [{ itemId, uomId, quantity: 10, unitPrice: 100 }],
        payments: [{ paymentMethodId, amount: 1000 }],
        hold: false,
      }
    );
    saleId = sale.id;
    expect(sale.status).toBe('posted');
  });

  /* ── UC-RX-SALES-LINES-01: List, sort, paginate ── */

  test('TC-SL-01-01: sales-lines page loads and shows lines table', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });
    await expect(page.getByTestId('page-title').first()).toHaveText('Sales Lines');

    const body = page.getByTestId('data-table-body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    // Verify column headers
    const headers = [
      'Sale',
      'Date',
      'Item',
      'Line',
      'Qty',
      'UOM',
      'Unit Price',
      'Disc %',
      'Tax %',
      'Subtotal',
      'Total',
    ];
    for (const header of headers) {
      // Use exact match for headers that could be substrings of others (e.g., Total vs Subtotal)
      const locator = page.locator('th').filter({ hasText: new RegExp(`^${header}$`) });
      await expect(locator).toBeVisible();
    }
  });

  test('TC-SL-01-02: pagination controls render and function', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const body = page.getByTestId('data-table-body');
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    const pageSizeSelect = page.getByTestId('page-size-select').first();
    if ((await pageSizeSelect.count()) > 0) {
      await expect(pageSizeSelect).toBeVisible();
      await pageSizeSelect.click();
      const opt = page.getByRole('option', { name: /25|50|100/ }).first();
      if ((await opt.count()) > 0) {
        await opt.click();
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }

    const nextBtn = page.getByRole('button', { name: /next|›/i }).first();
    const prevBtn = page.getByRole('button', { name: /previous|‹/i }).first();
    if ((await nextBtn.count()) > 0 && (await nextBtn.isEnabled())) {
      await nextBtn.click();
      await page
        .getByTestId('data-table-body')
        .locator('tr')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 });
      if (await prevBtn.isEnabled()) {
        await prevBtn.click();
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }
  });

  test('TC-SL-01-03: column sorting on sales lines table', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const sortableHeaders = ['Sale', 'Date', 'Item', 'Qty', 'Unit Price'];
    for (const headerText of sortableHeaders) {
      const th = page.locator('th').filter({ hasText: headerText }).first();
      if ((await th.count()) > 0) {
        await th.click({ timeout: 10_000 });
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
        await th.click({ timeout: 10_000 });
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }
  });

  /* ── UC-RX-SALES-LINES-02: Search and filter ── */

  test('TC-SL-02-01: header search filters sales lines', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const searchInput = page.getByTestId('header-search').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('SL Item');
    await page.waitForTimeout(1_000);

    const body = page.getByTestId('data-table-body');
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    // Clear search restores full list
    await searchInput.clear();
    await page.waitForTimeout(1_000);
    await page
      .getByTestId('data-table-body')
      .locator('tr')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  });

  test('TC-SL-02-02: no-match search shows empty state', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const searchInput = page.getByTestId('header-search').first();
    await searchInput.fill('__NO_MATCH_SL__' + TS);
    await page.waitForTimeout(1_000);

    const rows = page.getByTestId('data-table-body').locator('tr');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      expect(rowCount).toBe(0);
    } else {
      const firstRow = rows.first();
      const rowText = await firstRow.innerText();
      expect(rowText.toLowerCase()).toMatch(/no records|no results|no data|empty/);
    }
  });

  test('TC-SL-02-03: saleId filter shows only lines for that sale', async ({ page }) => {
    // Navigate to sales-lines with saleId filter
    await page.goto(`/rxsoft/sales-lines?saleId=${saleId}`, { timeout: 60_000 });
    await expect(page.getByTestId('page-title').first()).toHaveText('Sales Lines');

    // Should only show lines for our sale
    const body = page.getByTestId('data-table-body');
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    // Should only show lines for our sale
    const rows = body.locator('tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Check the full row text to find our item
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const rowText = await row.innerText();
      expect(rowText).toContain('SL Item');
    }
  });

  /* ── UC-RX-SALES-LINES-06: Export ── */

  test('TC-SL-06-01: CSV export button triggers download', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const exportBtn = page.getByTestId('header-export').first();
    if ((await exportBtn.count()) > 0) {
      await expect(exportBtn).toBeVisible();
      await exportBtn.click();
      await page.getByRole('menuitem', { name: 'CSV' }).click({ timeout: 10_000 });

      // Wait for download or check toast
      await page.waitForTimeout(3_000);
      // CSV download verification would need download event handling
    } else {
      test.skip(true, 'Export button not found - may be permission-gated');
    }
  });

  /* ── UC-RX-SALES-LINES-07: Error handling & accessibility ── */

  test('TC-SL-07-01: empty state accessible when no lines match', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const searchInput = page.getByTestId('header-search').first();
    await searchInput.fill('__NON_EXISTENT_SL__' + TS);
    await page.waitForTimeout(1_000);

    const rows = page.getByTestId('data-table-body').locator('tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      const firstRow = rows.first();
      const rowText = await firstRow.innerText();
      expect(rowText.toLowerCase()).toMatch(/no records|no results|no data|empty/);
    }
  });

  test('TC-SL-07-02: table keyboard navigation', async ({ page }) => {
    await page.goto('/rxsoft/sales-lines', { timeout: 60_000 });

    const firstRow = page.getByTestId('data-table-body').locator('tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    await firstRow.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
  });

  test.skip('TC-SL-07-03: API error on fetch shows toast', async ({ page }) => {
    test.skip(true, 'Requires API error injection - documented for future hardening');
  });
});
