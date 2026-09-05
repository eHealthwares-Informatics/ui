import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft Goods Receiving.
 *
 * Tests:
 *  1. Receives goods against a purchase order and verifies the receipt
 *     appears in the list with correct detail modal data.
 *  2. Opens the first receipt's detail modal, unposts its first active line
 *     using the backend's unpost password ('password12'), and asserts the
 *     success toast.
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

test.describe.serial('RxSoft goods receiving', () => {
  test.setTimeout(120_000);

  let supplierId: string;
  let warehouseId: string;
  let itemId: string;
  let uomId: string;
  let poId: string;
  let receiptNumber: string;
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

    if (poId) await apiDelete(`/purchases/${poId}`);
    if (itemId) await apiDelete(`/items/${itemId}`);
    if (warehouseId) await apiDelete(`/stock-locations/${warehouseId}`);
    if (supplierId) await apiDelete(`/customers/${supplierId}`);
    if (uomId) await apiDelete(`/uoms/${uomId}`);
  });

  // ── 0. Seed data ─────────────────────────────────────────────

  test('seeds prerequisite data via API', async ({ page }) => {
    const supplier = await apiCreate<{ id: string }>(page, '/customers', {
      partyType: 'supplier',
      name: `E2E Rcpt Supplier ${TS}`,
      phone: '08000000001',
      email: `rcpt-sup-${TS}@test.com`,
      addressLine1: '123 Supplier St',
      isActive: true,
    });
    supplierId = supplier.id;

    const location = await apiCreate<{ id: string }>(page, '/stock-locations', {
      code: `WH-RCPT-${TS}`,
      name: `E2E Rcpt Warehouse ${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    warehouseId = location.id;

    const uomCat = await apiCreate<{ id: string }>(page, '/uom-categories', {
      name: `E2E Rcpt UoM Cat ${TS}`,
    });
    const uom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `UN-R${TS}`,
      name: `E2E Rcpt Unit ${TS}`,
      uomType: 'reference',
      categoryId: uomCat.id,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    uomId = uom.id;

    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `E2E Rcpt Item ${TS}`,
      baseUomId: uomId,
      saleUomId: uomId,
      overrideCodeValidation: true,
    });
    itemId = item.id;

    // Create an approved purchase order
    const po = await apiCreate<{ id: string; status: string }>(page, '/purchases', {
      status: 'approved',
      warehouseId,
      supplierId,
      lines: [
        {
          itemId,
          uomId,
          orderedQty: 5,
          unitCost: 10,
        },
      ],
    });
    poId = po.id;
    expect(po.status).toBe('approved');

    // Receive goods against the PO
    receiptNumber = `GR-RCPT-${TS}`;
    const recv = await apiCreate<{ receiptNumber: string }>(
      page,
      `/purchases/${poId}/receive`,
      {
        purchaseOrderId: poId,
        receivedDate: new Date().toISOString(),
        receiptNumber,
        lines: [
          {
            itemId,
            receivedQty: 3,
            uomId,
            unitCost: 10,
          },
        ],
      },
    );
    expect(recv.receiptNumber).toBe(receiptNumber);

    accessToken = await readAccessToken(page);
  });

  // ── 1. Receive goods and verify receipt in the list ──────────

  test('receipt appears in the receiving list with correct detail', async ({ page }) => {
    await page.goto('/rxsoft/receiving');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // The receipt should appear in the list
    const receiptRow = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: receiptNumber })
      .first();
    await expect(receiptRow).toBeVisible({ timeout: 15_000 });

    // Click the receipt number (rendered as an Anchor <button>)
    const receiptLink = receiptRow.locator('button').first();
    await expect(receiptLink).toBeVisible();
    await receiptLink.click();

    // Detail modal opens
    const dialog = page.getByRole('dialog', { name: new RegExp(`Receipt #${receiptNumber}`) });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Verify PO number is displayed
    await expect(dialog).toContainText('PO:', { timeout: 5_000 });

    // Verify the receipt table has the expected columns
    await expect(dialog.locator('th').filter({ hasText: 'Item' })).toBeVisible();
    await expect(dialog.locator('th').filter({ hasText: 'Ordered' })).toBeVisible();
    await expect(dialog.locator('th').filter({ hasText: 'Received' })).toBeVisible();
    await expect(dialog.locator('th').filter({ hasText: 'UOM' })).toBeVisible();
    await expect(dialog.locator('th').filter({ hasText: 'Unit Cost' })).toBeVisible();
    await expect(dialog.locator('th').filter({ hasText: 'Status' })).toBeVisible();

    // Verify the receipt line shows the item name, received qty, and Active badge
    const lineRow = dialog.locator('tbody tr').first();
    await expect(lineRow).toBeVisible();
    await expect(lineRow).toContainText(`E2E Rcpt Item ${TS}`);
    await expect(lineRow).toContainText('3');
    await expect(lineRow.getByText('Active')).toBeVisible();

    // Close the modal
    await dialog.getByRole('button').last().click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  // ── 2. Unpost a receipt line ──────────────────────────────────

  test('opens a receipt detail and unposts a line', async ({ page }) => {
    await page.goto('/rxsoft/receiving');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    const receiptRow = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: receiptNumber })
      .first();
    await expect(receiptRow).toBeVisible({ timeout: 15_000 });

    const receiptLink = receiptRow.locator('button').first();
    await receiptLink.click();

    const dialog = page.getByRole('dialog', { name: /Receipt #/ });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Click the Unpost button on the first active line
    const unpostButton = dialog.getByRole('button', { name: 'Unpost', exact: true }).first();
    await expect(unpostButton).toBeEnabled({ timeout: 15_000 });
    await unpostButton.click();

    // Fill the unpost password and confirm
    await dialog.getByLabel('Unpost Password').fill('password12');
    await dialog.getByRole('button', { name: 'Confirm Unpost' }).click();

    await expect(page.getByText('Line unposted successfully.')).toBeVisible({
      timeout: 15_000,
    });
  });
});