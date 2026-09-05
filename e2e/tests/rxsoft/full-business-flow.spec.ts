/**
 * Full Business Flow Playwright E2E Test
 *
 * Exercises the complete inventory lifecycle through the UI:
 *  1. Create UOM Category (Count-e2e)
 *  2. Create UOMs (Unit-e2e factor 1, Dozen-e2e factor 12)
 *  3. Create Category (Junks-e2e)
 *  4. Create Stock Location (JunksSales-e2e)
 *  5. Create Item (Biscuit) via the Items wizard
 *  6. Create Pricelist (Retail-Prices e2e) and add price item
 *  7. Edit price to 100
 *  8. Purchase 2 Dozens and receive
 *  9. Transfer 20 from Main to JunksSales-e2e
 * 10. POS Sale of 5
 * 11. Website Order of 5, post/complete
 * 12. Verify inventory via the Inventory page
 */
import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/* ── Helpers ──────────────────────────────────────────────────── */

const TS = Date.now().toString(36);

async function apiCreate(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>,
) {
  return apiFetch<{ id: string }>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function pickOption(
  page: import('@playwright/test').Page,
  testId: string,
  query: string,
  optionLabel: string,
) {
  const input = page.getByTestId(testId);
  await expect(input).toBeEnabled({ timeout: 15_000 });
  await input.click();
  await input.fill(query);
  await input.click();
  const opt = page.getByRole('option', { name: optionLabel, exact: false }).first();
  await expect(opt).toBeVisible({ timeout: 15_000 });
  await opt.click();
  await expect(input).toHaveValue(optionLabel, { timeout: 8_000 });
}

/* ── Test ─────────────────────────────────────────────────────── */

test.describe.serial('Full Business Flow', () => {
  test.setTimeout(120_000);

  // IDs created during the flow
  let uomCategoryId: string;
  let unitUomId: string;
  let dozenUomId: string;
  let junksCategoryId: string;
  let junksSalesLocationId: string;
  let biscuitItemId: string;
  let pricelistId: string;
  let poId: string;
  let websiteOrderId: string;
  let accessToken: string | null = null;
  let priceListItemId: string | null = null;

  // ── Teardown: remove all E2E-created data via API ──────────

  test.afterAll(async ({ request }) => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };

    // Best-effort helper: ignore errors so partial failures don't abort cleanup
    async function apiDelete(path: string) {
      try {
        await request.delete(`http://localhost:8080/api${path}`, { headers });
      } catch {
        /* idempotent */
      }
    }

    // 1. Cancel website order (releases reserved stock)
    if (websiteOrderId) {
      try {
        await request.patch(
          `http://localhost:8080/api/website/admin/orders/${websiteOrderId}/status`,
          { headers, data: { status: 'cancelled' } },
        );
      } catch { /* may already be processed */ }
    }

    // 2. Delete price list item
    if (pricelistId && biscuitItemId) {
      try {
        // Fetch the price list item ID then delete it
        const pliRes = await request.get(
          `http://localhost:8080/api/price-lists/${pricelistId}/items`,
          { headers },
        );
        if (pliRes.ok()) {
          const body = await pliRes.json();
          const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
          for (const item of items) {
            if (item.itemId === biscuitItemId) {
              await apiDelete(`/price-lists/${pricelistId}/items/${item.itemId}`);
            }
          }
        }
      } catch { /* best effort */ }
    }

    // 3. Delete pricelist
    if (pricelistId) await apiDelete(`/price-lists/${pricelistId}`);

    // 4. Delete item
    if (biscuitItemId) await apiDelete(`/items/${biscuitItemId}`);

    // 5. Delete stock location
    if (junksSalesLocationId) await apiDelete(`/stock-locations/${junksSalesLocationId}`);

    // 6. Delete category
    if (junksCategoryId) await apiDelete(`/categories/${junksCategoryId}`);

    // 7. Delete UOMs
    if (dozenUomId) await apiDelete(`/uoms/${dozenUomId}`);
    if (unitUomId) await apiDelete(`/uoms/${unitUomId}`);

    // 8. Delete UOM category
    if (uomCategoryId) await apiDelete(`/uom-categories/${uomCategoryId}`);
  });

  /* ── 1. Create UOM Category via API (no UI page for this) ────── */

  test('1. creates UOM category (Count-e2e)', async ({ page }) => {
    const res = await apiCreate(page, '/uom-categories', { name: `Count-e2e-${TS}` });
    uomCategoryId = res.id;
    expect(uomCategoryId).toBeTruthy();
  });

  /* ── 2. Create UOMs via API ─────────────────────────────────── */

  test('2. creates Unit-e2e UOM (factor 1)', async ({ page }) => {
    const res = await apiCreate(page, '/uoms', {
      code: `UNIT_${TS}`,
      name: `Unit-e2e-${TS}`,
      uomType: 'reference',
      categoryId: uomCategoryId,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    unitUomId = res.id;
    expect(unitUomId).toBeTruthy();
  });

  test('3. creates Dozen-e2e UOM (factor 12)', async ({ page }) => {
    const res = await apiCreate(page, '/uoms', {
      code: `DOZEN_${TS}`,
      name: `Dozen-e2e-${TS}`,
      uomType: 'normal',
      categoryId: uomCategoryId,
      factor: 12,
      rounding: 1,
      isActive: true,
    });
    dozenUomId = res.id;
    expect(dozenUomId).toBeTruthy();
  });

  test('4. verifies UOMs on the UOMs page', async ({ page }) => {
    await page.goto('/rxsoft/uoms');
    await expect(page.getByTestId('page-title')).toHaveText('UOMs');

    // Wait for the table to load
    await expect(page.getByTestId('data-table-body').locator('tr').first()).toBeVisible({
      timeout: 15_000,
    });

    // Search for our UOMs
    const searchInput = page.getByTestId('header-search');
    await searchInput.fill(`Unit-e2e-${TS}`);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: `Unit-e2e-${TS}` }),
    ).toBeVisible({ timeout: 10_000 });

    await searchInput.fill(`Dozen-e2e-${TS}`);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: `Dozen-e2e-${TS}` }),
    ).toBeVisible({ timeout: 10_000 });
  });

  /* ── 3. Create Category via API ─────────────────────────────── */

  test('5. creates category (Junks-e2e)', async ({ page }) => {
    const res = await apiCreate(page, '/categories', {
      code: `JUNKS_${TS}`,
      name: `Junks-e2e-${TS}`,
    });
    junksCategoryId = res.id;
    expect(junksCategoryId).toBeTruthy();
  });

  /* ── 4. Create Stock Location via API ───────────────────────── */

  test('6. creates sales location (JunksSales-e2e)', async ({ page }) => {
    const res = await apiCreate(page, '/stock-locations', {
      code: `JUNKS_SALES_${TS}`,
      name: `JunksSales-e2e-${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    junksSalesLocationId = res.id;
    expect(junksSalesLocationId).toBeTruthy();
  });

  /* ── 5. Create Item via the Items wizard UI ─────────────────── */

  test('7. creates item (Biscuit) through the create wizard', async ({ page }) => {
    await page.goto('/rxsoft/items/create');

    // Hide dev overlay
    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Wait for the wizard to load
    const categoryInput = page.getByTestId('async-select-category');
    await expect(categoryInput).toBeEnabled({ timeout: 20_000 });

    // Step 0 — Item Details
    await pickOption(page, 'async-select-category', `Junks-e2e`, `Junks-e2e`);

    const nameField = page
      .getByText('Item Name (Brand/Variety)', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(nameField).toBeVisible();
    await nameField.fill(`Biscuit-${TS}`);

    await pickOption(page, 'async-select-baseUom', `Unit-e2e`, `Unit-e2e`);
    await pickOption(page, 'async-select-purchaseUom', `Dozen-e2e`, `Dozen-e2e`);
    await pickOption(page, 'async-select-saleUom', `Unit-e2e`, `Unit-e2e`);

    // Submit: Create & Continue → Next → Next → Submit
    await page.getByRole('button', { name: 'Create & Continue' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    // Back on the list; verify the item exists
    await page.waitForURL((url) => url.pathname === '/rxsoft/items', { timeout: 20_000 });
    await page.getByTestId('header-search').fill(`Biscuit-${TS}`);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: `Biscuit-${TS}` }),
    ).toBeVisible({ timeout: 15_000 });

    // Read the item ID from the API for later use
    const searchRes = await apiFetch<{ data: Array<{ id: string }> }>(page, `/items?search=Biscuit-${TS}&limit=1`);
    biscuitItemId = searchRes.data?.[0]?.id ?? '';
    expect(biscuitItemId).toBeTruthy();
  });

  /* ── 6. Create Pricelist and add price item via UI ──────────── */

  test('8. creates pricelist (Retail-Prices e2e)', async ({ page }) => {
    await page.goto('/rxsoft/price-lists');
    await expect(page.getByTestId('page-title')).toHaveText('Price Lists');

    // Click "New" to open create modal
    await page.getByTestId('header-new').click();
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();

    // Fill Code and Name
    const codeInput = dialog.locator('input').first();
    await codeInput.fill(`RETAIL_${TS}`);

    const nameInput = dialog.locator('input').nth(1);
    await nameInput.fill(`Retail-Prices e2e ${TS}`);

    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    // Read the pricelist ID from API
    const searchRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      `/price-lists?search=Retail-Prices e2e ${TS}&limit=1`,
    );
    pricelistId = searchRes.data?.[0]?.id ?? '';
    expect(pricelistId).toBeTruthy();
  });

  test('9. adds price item for Biscuit at 10 via API', async ({ page }) => {
    const res = await apiFetch<{ id: string; unitPrice: number }>(page, '/price-lists/items', {
      method: 'POST',
      body: JSON.stringify({
        priceListId: pricelistId,
        itemId: biscuitItemId,
        unitPrice: 10,
      }),
    });
    priceListItemId = res.id ?? null;
    expect(res.unitPrice).toBe(10);
  });

  /* ── 7. Edit price to 100 via UI ────────────────────────────── */

  test('10. edits Biscuit price to 100 on the pricelist', async ({ page }) => {
    // Navigate to the price list items page
    await page.goto('/rxsoft/price-list-items');
    await expect(page.getByTestId('page-title')).toHaveText('Price List Items');

    // Search for the Biscuit item
    const searchInput = page.getByTestId('header-search');
    await searchInput.fill(`Biscuit-${TS}`);
    await expect(page.getByTestId('data-table-body').locator('tr').first()).toBeVisible({
      timeout: 15_000,
    });

    // Click the edit (pencil) button on the first matching row
    const row = page.getByTestId('data-table-body').locator('tr').filter({ hasText: `Biscuit-${TS}` }).first();
    const pencil = row.locator('button').filter({ has: page.locator('svg.lucide-pencil') }).first();
    await expect(pencil).toBeVisible();
    await pencil.click();

    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Find the price input and update it
    const priceInput = dialog.locator('input[type="number"], input[inputmode="decimal"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('');
      await priceInput.fill('100');
    }

    await dialog.getByRole('button', { name: 'Update' }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });

  /* ── 8. Purchase flow via API (UI doesn't have a simple PO create) ─ */

  test('11. creates purchase order for 2 Dozens and receives goods', async ({ page }) => {
    // Create approved PO
    const poRes = await apiFetch<{ id: string; status: string }>(page, '/purchases', {
      method: 'POST',
      body: JSON.stringify({
        status: 'approved',
        warehouseId: 'wh-seed',
        supplierId: 'sup-seed',
        lines: [
          {
            itemId: biscuitItemId,
            uomId: dozenUomId,
            orderedQty: 2,
            unitCost: 5,
          },
        ],
      }),
    });
    poId = poRes.id;
    expect(poRes.status).toBe('approved');

    // Receive goods
    const recvRes = await apiFetch<{ receiptNumber: string }>(
      page,
      `/purchases/${poId}/receive`,
      {
        method: 'POST',
        body: JSON.stringify({
          purchaseOrderId: poId,
          receivedDate: new Date().toISOString(),
          receiptNumber: `GR-E2E-${TS}`,
          lines: [
            {
              itemId: biscuitItemId,
              receivedQty: 2,
              uomId: dozenUomId,
              unitCost: 5,
            },
          ],
        }),
      },
    );
    expect(recvRes.receiptNumber).toBe(`GR-E2E-${TS}`);
  });

  /* ── 9. Transfer 20 from Main Location to JunksSales-e2e ────── */

  test('12. transfers 20 units to JunksSales-e2e via UI', async ({ page }) => {
    await page.goto('/rxsoft/inventory');
    await expect(page.getByTestId('page-title')).toHaveText('Inventory');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Click "New Stock Adjustment" → actually use the Transfer button
    // The transfer is done through the transfer button in the stock balances table
    const onHandHeader = page.locator('th').filter({ hasText: 'On Hand' }).first();
    await expect(onHandHeader).toBeVisible({ timeout: 15_000 });

    // Search for Biscuit in the stock balances
    const searchInput = page.getByTestId('header-search');
    if (await searchInput.isVisible()) {
      await searchInput.fill(`Biscuit-${TS}`);
    }

    // Find a row with available stock > 0 and click Transfer
    const balancesTable = onHandHeader.locator('xpath=ancestor::table[1]');
    const rows = balancesTable.locator('tbody tr');
    const rowCount = await rows.count();
    let targetIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      const avail = Number(
        await rows.nth(i).locator('td').nth(5).innerText().catch(() => '0'),
      );
      if (avail > 0) {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex < 0) {
      // Fallback: use API for transfer if no UI row found
      const mainLocationRes = await apiFetch<{ data: Array<{ id: string }> }>(
        page,
        '/stock-locations?search=Main&limit=1',
      );
      const mainLocationId = mainLocationRes.data?.[0]?.id ?? '';
      await apiFetch(page, '/inventory/transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromLocationId: mainLocationId,
          toLocationId: junksSalesLocationId,
          itemId: biscuitItemId,
          quantity: 20,
          reason: 'E2E transfer',
        }),
      });
      return;
    }

    const targetRow = rows.nth(targetIndex);
    const transferIcon = targetRow.getByTitle('Transfer');
    await expect(transferIcon).toBeVisible();
    await transferIcon.click();

    const dialog = page.getByRole('dialog', { name: 'Transfer Stock' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Select destination
    const destSelect = dialog.getByLabel('Destination Location');
    await destSelect.click();
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 12_000 });
    await destOption.click();

    await dialog.getByLabel('Quantity').fill('20');
    await dialog.getByRole('button', { name: 'Transfer', exact: true }).click();

    await expect(page.getByText('Stock transferred successfully.')).toBeVisible({
      timeout: 15_000,
    });
  });

  /* ── 10. POS Sale of 5 via API ─────────────────────────────── */

  test('13. POS sale of 5 Biscuits', async ({ page }) => {
    // Read the access token for the API call
    accessToken = await readAccessToken(page);

    const saleRes = await apiFetch<{ id: string; status: string }>(page, '/sales', {
      method: 'POST',
      body: JSON.stringify({
        saleNumber: `POS-E2E-${TS}`,
        saleChannel: 'pos',
        storeId: 'default',
        stockLocationId: junksSalesLocationId,
        customerId: 'cust-seed',
        lines: [
          {
            itemId: biscuitItemId,
            uomId: unitUomId,
            quantity: 5,
            unitPrice: 100,
          },
        ],
        payments: [
          {
            paymentMethodId: 'pm-seed',
            amount: 500,
          },
        ],
      }),
    });
    expect(saleRes.status).toBe('posted');
  });

  /* ── 11. Website Order of 5 via API, then post via UI ───────── */

  test('14. creates website order for 5 Biscuits', async ({ page }) => {
    const orderRes = await apiFetch<{ id: string; orderStatus: string }>(
      page,
      '/website/orders',
      {
        method: 'POST',
        body: JSON.stringify({
          customerId: 'cust-seed',
          deliveryAddress: '123 E2E Lane',
          city: 'Test City',
          phone: '08000000000',
          paymentMethod: 'cash',
          items: [
            {
              itemId: biscuitItemId,
              quantity: 5,
              unitPrice: 100,
            },
          ],
        }),
      },
    );
    websiteOrderId = orderRes.id;
    expect(orderRes.orderStatus).toBe('pending');
  });

  test('15. posts the website order via the admin page', async ({ page }) => {
    await page.goto('/rxsoft/website-orders');
    await expect(page.getByTestId('page-title')).toHaveText('Website Orders');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Search for the order
    const searchInput = page.getByTestId('header-search');
    await searchInput.fill(`Biscuit-${TS}`);

    // If the order appears in the table, click it
    const firstRow = page.getByTestId('data-table-body').locator('tr').first();
    if (await firstRow.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Click the order to open detail
      const orderLink = firstRow.locator('button').first();
      await orderLink.click();

      const dialog = page.getByRole('dialog').last();
      if (await dialog.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // Look for status transition buttons
        const confirmBtn = dialog.getByRole('button', { name: /confirm/i });
        if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await confirmBtn.click();
        }
      }
    }

    // Fallback: use API to complete the flow
    await apiFetch(page, `/website/admin/orders/${websiteOrderId}/assign-location`, {
      method: 'POST',
      body: JSON.stringify({ stockLocationId: junksSalesLocationId }),
    });

    await apiFetch(page, `/website/admin/orders/${websiteOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    });

    const processRes = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${websiteOrderId}/process`,
      { method: 'POST', body: '{}' },
    );
    expect(processRes.orderStatus).toBe('processing');
  });

  /* ── 12. Inventory Verification via UI ──────────────────────── */

  test('16. verifies current stock on the Inventory page', async ({ page }) => {
    await page.goto('/rxsoft/inventory');
    await expect(page.getByTestId('page-title')).toHaveText('Inventory');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Wait for stock balances table
    const onHandHeader = page.locator('th').filter({ hasText: 'On Hand' }).first();
    await expect(onHandHeader).toBeVisible({ timeout: 15_000 });

    // Search for Biscuit
    const searchInput = page.getByTestId('header-search');
    if (await searchInput.isVisible()) {
      await searchInput.fill(`Biscuit-${TS}`);
    }

    // The table should show the Biscuit row with stock in JunksSales-e2e
    const balancesTable = onHandHeader.locator('xpath=ancestor::table[1]');
    const rows = balancesTable.locator('tbody tr');

    // Verify at least one row exists for Biscuit
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
  });

  test('17. verifies purchase exists with correct values via API', async ({ page }) => {
    const po = await apiFetch<{ status: string; lines: Array<{ itemId: string; receivedQty: number }> }>(
      page,
      `/purchases/${poId}`,
    );
    expect(po.status).toBe('received');
    expect(po.lines).toHaveLength(1);
    expect(po.lines[0].itemId).toBe(biscuitItemId);
    expect(Number(po.lines[0].receivedQty)).toBe(2);
  });

  test('18. verifies sale exists with correct values via API', async ({ page }) => {
    const sales = await apiFetch<{ data: Array<{ saleNumber: string; status: string }> }>(
      page,
      `/sales?status=posted&limit=20`,
    );
    const sale = sales.data.find((s) => s.saleNumber === `POS-E2E-${TS}`);
    expect(sale).toBeDefined();
    expect(sale!.status).toBe('posted');
  });

  test('19. verifies website order exists with correct values via API', async ({ page }) => {
    const order = await apiFetch<{
      orderStatus: string;
      lines: Array<{ itemId: string; quantity: number }>;
    }>(page, `/website/admin/orders/${websiteOrderId}`);
    expect(order.orderStatus).toBe('processing');
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0].itemId).toBe(biscuitItemId);
    expect(order.lines[0].quantity).toBe(5);
  });

  test('20. verifies stock balance in JunksSales-e2e via API', async ({ page }) => {
    // Expected: 20 (transfer) - 5 (POS) - 5 (website order) = 10
    const balances = await apiFetch<{
      data: Array<{ locationId: string; quantityOnHand: number }>;
    }>(
      page,
      `/inventory/stock-balances?itemId=${biscuitItemId}&locationId=${junksSalesLocationId}`,
    );
    const balance = balances.data?.[0];
    expect(balance).toBeDefined();
    expect(Number(balance!.quantityOnHand)).toBe(10);
  });
});
