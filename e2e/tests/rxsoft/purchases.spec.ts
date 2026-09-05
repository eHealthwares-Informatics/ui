import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft purchases page — end-to-end Playwright test.
 *
 * Seeds prerequisite data via API (supplier, warehouse, item, UOM),
 * then exercises the purchases CRUD through the UI:
 *   1. List page renders with table columns
 *   2. Create a new purchase order via the create modal
 *   3. View purchase detail via the Eye icon
 *   4. Edit a purchase line
 *   5. Verify status display
 *   6. Teardown removes E2E-created data via API
 */

const TS = Date.now().toString(36);

async function apiCreate<T>(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  return apiFetch<T>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

test.describe.serial('RxSoft purchases', () => {
  test.setTimeout(120_000);

  let supplierId: string;
  let warehouseId: string;
  let itemId: string;
  let uomId: string;
  let purchaseId: string;
  let accessToken: string | null = null;

  // ── Teardown ─────────────────────────────────────────────────

  test.afterAll(async ({ request }) => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };

    async function apiDelete(path: string) {
      try {
        await request.delete(`http://localhost:8080/api${path}`, { headers });
      } catch {
        /* best-effort */
      }
    }

    // Delete in reverse dependency order
    if (purchaseId) await apiDelete(`/purchases/${purchaseId}`);
    if (itemId) await apiDelete(`/items/${itemId}`);
    if (warehouseId) await apiDelete(`/stock-locations/${warehouseId}`);
    if (supplierId) await apiDelete(`/customers/${supplierId}`);
    if (uomId) await apiDelete(`/uoms/${uomId}`);
  });

  // ── Prerequisite seeding ─────────────────────────────────────

  test('seeds supplier, warehouse, item, and UOM via API', async ({ page }) => {
    // Create supplier
    const supplier = await apiCreate<{ id: string }>(page, '/customers', {
      partyType: 'supplier',
      name: `E2E Supplier ${TS}`,
      phone: '08000000001',
      email: `supplier-${TS}@test.com`,
      addressLine1: '123 Supplier Street',
      isActive: true,
    });
    supplierId = supplier.id;
    expect(supplierId).toBeTruthy();

    // Create stock location (warehouse)
    const location = await apiCreate<{ id: string }>(page, '/stock-locations', {
      code: `WH-${TS}`,
      name: `E2E Warehouse ${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    warehouseId = location.id;
    expect(warehouseId).toBeTruthy();

    // Create a UOM category + UOM
    const uomCat = await apiCreate<{ id: string }>(page, '/uom-categories', {
      name: `E2E UoM Cat ${TS}`,
    });
    const uom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `UN-${TS}`,
      name: `E2E Unit ${TS}`,
      uomType: 'reference',
      categoryId: uomCat.id,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    uomId = uom.id;

    // Create an item
    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `E2E Biscuit ${TS}`,
      baseUomId: uomId,
      saleUomId: uomId,
      overrideCodeValidation: true,
    });
    itemId = item.id;
    expect(itemId).toBeTruthy();

    accessToken = await readAccessToken(page);
  });

  // ── 1. List page renders ─────────────────────────────────────

  test('purchases list renders with table columns', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    await expect(page.getByTestId('page-title')).toHaveText('Purchases');
    await expect(page.getByTestId('header-search')).toBeVisible();
    await expect(page.getByTestId('header-new')).toBeVisible();

    for (const header of ['PO/Invoice', 'Supplier', 'Warehouse', 'Total Cost', 'Status', 'Lines']) {
      await expect(page.locator('th').filter({ hasText: header })).toBeVisible();
    }
  });

  // ── 2. Create a purchase order via the modal ─────────────────

  test('creates a purchase order through the create modal', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Open create modal
    await page.getByTestId('header-new').click();
    const dialog = page.getByRole('dialog', { name: /Create Purchase/ });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Fill Supplier (async-select)
    const supplierSelect = page.getByTestId('async-select-supplier');
    await expect(supplierSelect).toBeVisible();
    await supplierSelect.click();
    await supplierSelect.fill(`E2E Supplier ${TS}`);
    const supplierOption = page.getByRole('option', { name: new RegExp(`E2E Supplier ${TS}`) }).first();
    await expect(supplierOption).toBeVisible({ timeout: 15_000 });
    await supplierOption.click();

    // Fill Warehouse (async-select)
    const warehouseSelect = page.getByTestId('async-select-warehouse');
    await expect(warehouseSelect).toBeVisible();
    await warehouseSelect.click();
    await warehouseSelect.fill(`E2E Warehouse ${TS}`);
    const warehouseOption = page.getByRole('option', { name: new RegExp(`E2E Warehouse ${TS}`) }).first();
    await expect(warehouseOption).toBeVisible({ timeout: 15_000 });
    await warehouseOption.click();

    // Fill Product ID (text input — the createFields label is "Product ID")
    const productIdField = dialog
      .getByText('Product ID', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(productIdField).toBeVisible();
    await productIdField.fill(itemId);

    // Fill Quantity
    const quantityField = dialog
      .getByText('Quantity', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(quantityField).toBeVisible();
    await quantityField.fill('10');

    // Fill Unit Cost
    const unitCostField = dialog
      .getByText('Unit Cost', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(unitCostField).toBeVisible();
    await unitCostField.fill('25');

    // Fill Invoice/PO Number
    const invoiceField = dialog
      .getByText('Invoice/PO Number', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(invoiceField).toBeVisible();
    await invoiceField.fill(`PO-E2E-${TS}`);

    // Fill Currency Code
    const currencyField = dialog
      .getByText('Currency Code', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(currencyField).toBeVisible();
    await currencyField.fill('NGN');

    // Fill Status
    const statusField = dialog
      .getByText('Status', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(statusField).toBeVisible();
    await statusField.fill('draft');

    // Submit
    await dialog.getByRole('button', { name: 'Create' }).click();

    // Wait for modal to close and verify the purchase appears in the list
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    // Search for our purchase
    await page.getByTestId('header-search').fill(`PO-E2E-${TS}`);
    const row = page.getByTestId('data-table-body').locator('tr').filter({ hasText: `PO-E2E-${TS}` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Extract purchase ID from the Eye link's href
    const eyeLink = row.locator('a[href*="/rxsoft/purchases/"]').first();
    await expect(eyeLink).toBeVisible();
    const href = await eyeLink.getAttribute('href');
    const match = href?.match(/\/purchases\/([a-f0-9-]+)/i);
    expect(match).toBeTruthy();
    purchaseId = match![1];
  });

  // ── 3. View purchase detail via Eye icon ──────────────────────

  test('views purchase detail via the Eye icon', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Search for our purchase
    await page.getByTestId('header-search').fill(`PO-E2E-${TS}`);
    const row = page.getByTestId('data-table-body').locator('tr').filter({ hasText: `PO-E2E-${TS}` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click the Eye icon to navigate to detail
    const eyeLink = row.locator('a[href*="/rxsoft/purchases/"]').first();
    await expect(eyeLink).toBeVisible();
    await eyeLink.click();

    // Verify we navigated to the detail page
    await page.waitForURL((url) => url.pathname.includes('/rxsoft/purchases/'), { timeout: 15_000 });

    // The detail view should show the PO number
    await expect(page.getByText(`PO-E2E-${TS}`, { exact: false })).toBeVisible({ timeout: 15_000 });
  });

  // ── 4. Verify status display ─────────────────────────────────

  test('purchase shows correct status in list', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    await page.getByTestId('header-search').fill(`PO-E2E-${TS}`);
    const row = page.getByTestId('data-table-body').locator('tr').filter({ hasText: `PO-E2E-${TS}` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // The row should contain the status
    await expect(row).toContainText('draft', { timeout: 15_000 });

    // Verify supplier and warehouse are shown
    await expect(row).toContainText(`E2E Supplier ${TS}`);
    await expect(row).toContainText(`E2E Warehouse ${TS}`);
  });

  // ── 5. Delete a purchase via row action ───────────────────────

  test('deletes the purchase order via row action', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    await page.getByTestId('header-search').fill(`PO-E2E-${TS}`);
    const row = page.getByTestId('data-table-body').locator('tr').filter({ hasText: `PO-E2E-${TS}` }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click the trash icon
    const trashButton = row.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await expect(trashButton).toBeVisible();
    await trashButton.click();

    // Confirm deletion dialog
    const confirmDialog = page.getByRole('dialog', { name: /Delete/ });
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();

    // Verify the purchase is removed from the list
    await expect(row).toBeHidden({ timeout: 15_000 });
    purchaseId = ''; // Cleared — teardown should skip delete
  });
});
