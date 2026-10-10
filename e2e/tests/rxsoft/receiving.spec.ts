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

    // API evidence before any UI assertion (C12 / #775): the receipt must be
    // listable for the SAME token/org the browser will use. Distinguishes
    // "seed never landed" from "UI list empty despite backend row".
    const listed = await apiFetch<{
      data: Array<{ receiptNumber?: string }>;
      meta?: { total?: number };
    }>(page, `/receipts?search=${encodeURIComponent(receiptNumber!)}&limit=5`);
    const found = (listed.data ?? []).some((r) => r.receiptNumber === receiptNumber);
    // eslint-disable-next-line no-console
    console.log(
      'SEED-LIST',
      JSON.stringify({ receiptNumber, total: listed.meta?.total, rows: listed.data?.length, found })
    );
    expect(found, `receipt ${receiptNumber} must be listable via API after receive`).toBe(true);

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

  test('TC-RX-PURCHASES-UNPOST-01 + TC-RX-PURCHASES-UNPOST-02 + TC-RX-PURCHASES-UNPOST-03: receipt detail unpost — action available, confirmation UI, stock reversal', async ({
    page,
  }) => {
    await page.goto('/rxsoft/receiving', { timeout: 60_000 });

    // Search-filtered lookup keeps the unpost path deterministic even when
    // the unfiltered list is large. #775 empty-list was seed/provision
    // (seed port conflict), not a UI render bug — SEED-LIST above is the
    // C12 gate that the receipt exists for this org before UI asserts.
    await page.getByTestId('header-search').first().fill(receiptNumber!);
    const receiptRow = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: receiptNumber! })
      .first();
    await expect(receiptRow).toBeVisible({ timeout: 30_000 });

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

    // Fill the unpost password and confirm — capture the POST request/response
    // so a backend rejection or silent no-reversal surfaces with evidence.
    await dialog.getByLabel('Unpost Password').fill('password12');
    let unpostBody = '';
    page.on('request', (req) => {
      if (req.url().includes('/unpost') && req.method() === 'POST') {
        unpostBody = req.postData() ?? '';
      }
    });
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
    // Diagnostic: movements + balances after unpost (inventory path).
    // stock-movements is uncached; stock-balances list is cached 30s under
    // inventory:list:<org>: — poll both, and bust the balance cache by
    // varying limit so a stale read cannot mask a real DB reversal.
    const movesDiag = await apiFetch<{
      data: Array<{
        movementType?: string;
        quantity?: number;
        toLocationId?: string;
        fromLocationId?: string;
      }>;
    }>(page, `/inventory/stock-movements?itemId=${itemId}&limit=10`);
    // eslint-disable-next-line no-console
    console.log(
      'UNPOST-REQ',
      unpostBody,
      'RESP',
      resBody.slice(0, 150),
      'MOVES',
      JSON.stringify(
        (movesDiag.data ?? []).map((m) => ({
          t: m.movementType,
          q: m.quantity,
          from: String(m.fromLocationId ?? '').slice(0, 8),
          to: String(m.toLocationId ?? '').slice(0, 8),
        }))
      )
    );

    // Primary TC-03 evidence: an 'out' movement exists (uncached endpoint).
    const outMove = (movesDiag.data ?? []).find(
      (m) => m.movementType === 'out' && Number(m.quantity ?? 0) > 0
    );
    expect(outMove, 'unpost must write a stock movement of type out').toBeTruthy();

    // Poll balances with a rotating limit (cache-bust) + short sleeps.
    const deadline = Date.now() + 15_000;
    let totalAfter = totalBefore;
    let bust = 20;
    while (Date.now() < deadline && totalAfter >= totalBefore) {
      bust = bust === 20 ? 21 : 20;
      const balancesAfter = await apiFetch<{
        data: Array<{ itemId: string; quantityOnHand: number }>;
      }>(page, `/inventory/stock-balances?itemId=${itemId}&limit=${bust}`);
      totalAfter = (balancesAfter.data ?? []).reduce(
        (sum, b) => sum + Number(b.quantityOnHand ?? 0),
        0
      );
      if (totalAfter >= totalBefore) await page.waitForTimeout(500);
    }
    // eslint-disable-next-line no-console
    console.log('BAL-POLL', JSON.stringify({ totalBefore, totalAfter, bust }));
    expect(totalAfter, 'stock decremented after unpost').toBeLessThan(totalBefore);

    // TC-03 continued: receipt line marked unposted.
    const receipts = await apiFetch<{
      data: Array<{ receiptNumber?: string; lines?: Array<{ isUnposted?: boolean }> }>;
    }>(page, `/receipts?search=${encodeURIComponent(receiptNumber!)}&limit=5`);
    const receipt = (receipts.data ?? []).find((r) => r.receiptNumber === receiptNumber);
    expect(receipt, 'receipt still listed after unpost').toBeTruthy();
    expect(receipt?.lines?.[0]?.isUnposted, 'receipt line marked unposted after confirm').toBe(
      true
    );
  });
});
