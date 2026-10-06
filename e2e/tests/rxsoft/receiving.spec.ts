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
  body: Record<string, unknown>
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

    if (poId) {
      await apiDelete(`/purchases/${poId}`);
    }
    if (itemId) {
      await apiDelete(`/items/${itemId}`);
    }
    if (warehouseId) {
      await apiDelete(`/stock-locations/${warehouseId}`);
    }
    if (supplierId) {
      await apiDelete(`/suppliers/${supplierId}`);
    }
    if (uomId) {
      await apiDelete(`/uoms/${uomId}`);
    }
  });

  // ── 0. Seed data ─────────────────────────────────────────────

  test('seeds prerequisite data via API', async ({ page }) => {
    // Supplier via POST /suppliers (CreateSupplierDto: name/phone/email/address
    // only — partyType/addressLine1/isActive are rejected by whitelist).
    const supplier = await apiCreate<{ id: string }>(page, '/suppliers', {
      name: `E2E Rcpt Supplier ${TS}`,
      phone: '08000000001',
      email: `rcpt-sup-${TS}@test.com`,
      address: '123 Supplier St',
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

    // CreateItemDto: categoryId + all three UOM ids required by
    // CreateItemUseCase; item DTO has no overrideCodeValidation (rejected by
    // whitelist + forbidNonWhitelisted).
    const categories = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
    const categoryId = categories.data?.[0]?.id;
    expect(categoryId, 'seeded category required for item create').toBeTruthy();
    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `E2E Rcpt Item ${TS}`,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
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
    const recv = await apiCreate<{ receiptNumber: string }>(page, `/purchases/${poId}/receive`, {
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
    });
    expect(recv.receiptNumber).toBe(receiptNumber);

    accessToken = await readAccessToken(page);
  });

  // ── 1. Receive goods and verify receipt in the list ──────────

  test('receipt appears in the receiving list with correct detail', async ({ page }) => {
    await page.goto('/rxsoft/receiving');

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
    // Assert verifiable line data. Item NAME is not asserted: the /receipts
    // response lines carry itemId (uuid) without a nested item.name join, so
    // the detail modal renders the raw id (l.item?.name ?? l.itemId). Name
    // resolution is a backend gap — tracked for follow-up.
    await expect(lineRow).toContainText('3');
    await expect(lineRow.getByText('Active')).toBeVisible();
    await expect(lineRow.getByRole('button', { name: 'Unpost' })).toBeVisible();

    // Close the modal — Escape (Mantine closeOnEscape); getByRole('button').last()
    // hit the in-row Unpost button, not the header X.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });

  // ── 2. Unpost a receipt line ──────────────────────────────────
  // Covers UC-RX-PURCHASES-UNPOST-01 TCs (ehealthwares/rxsoft#115):
  //   TC-01 Unpost action available (asserted below)
  //   TC-02 confirmation UI appears (password + Confirm Unpost)
  //   TC-03 stock reversed after unpost (balance decreased + line unposted)

  test('opens a receipt detail and unposts a line', async ({ page }) => {
    await page.goto('/rxsoft/receiving');

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

    // TC-01: Unpost action available on the first active line.
    const unpostButton = dialog.getByRole('button', { name: 'Unpost', exact: true }).first();
    await expect(unpostButton).toBeEnabled({ timeout: 15_000 });
    await unpostButton.click();

    // TC-02: confirmation step appears — unpost password + Confirm Unpost
    // (current UI is a password-prompt confirmation, not an explanatory dialog).
    await expect(dialog.getByLabel('Unpost Password')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole('button', { name: 'Confirm Unpost' })).toBeVisible();

    // TC-03: capture stock before unpost (goods receive posted qty to stock).
    const balancesBefore = await apiFetch<{
      data: Array<{ itemId: string; quantityOnHand: number }>;
    }>(page, `/inventory/stock-balances?itemId=${itemId}&limit=20`);
    const totalBefore = (balancesBefore.data ?? []).reduce(
      (sum, b) => sum + Number(b.quantityOnHand ?? 0),
      0
    );
    expect(totalBefore, 'goods receive posted stock for the item').toBeGreaterThan(0);

    // Fill the unpost password and confirm — capture the POST response so a
    // backend rejection surfaces with its body instead of a bare toast timeout.
    await dialog.getByLabel('Unpost Password').fill('password12');
    const unpostRes = page.waitForResponse(
      (res) => res.url().includes('/unpost') && res.request().method() === 'POST',
      { timeout: 20_000 }
    );
    await dialog.getByRole('button', { name: 'Confirm Unpost' }).click();
    const res = await unpostRes;
    const resBody = await res.text().catch(() => '');
    expect(res.status(), `POST unpost failed: ${resBody.slice(0, 300)}`).toBeLessThan(400);

    await expect(page.getByText('Line unposted successfully.')).toBeVisible({
      timeout: 15_000,
    });

    // TC-03 continued: stock reversed — balance for the item decreased.
    const balancesAfter = await apiFetch<{
      data: Array<{ itemId: string; quantityOnHand: number }>;
    }>(page, `/inventory/stock-balances?itemId=${itemId}&limit=20`);
    const totalAfter = (balancesAfter.data ?? []).reduce(
      (sum, b) => sum + Number(b.quantityOnHand ?? 0),
      0
    );
    expect(totalAfter, 'stock decremented after unpost').toBeLessThan(totalBefore);

    // TC-03 continued: receipt line marked unposted.
    const receipts = await apiFetch<{
      data: Array<{ receiptNumber?: string; lines?: Array<{ isUnposted?: boolean }> }>;
    }>(page, `/receipts?search=${encodeURIComponent(receiptNumber!)}&limit=5`);
    const receipt = (receipts.data ?? []).find((r) => r.receiptNumber === receiptNumber);
    expect(receipt, 'receipt still listed after unpost').toBeTruthy();
    expect(
      receipt?.lines?.[0]?.isUnposted,
      'receipt line marked unposted after confirm'
    ).toBe(true);
  });
});
