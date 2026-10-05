import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * Shop PO flow — UC-RX-PURCHASES-SHOP-01 (ehealthwares/rxsoft#773).
 *
 * Rewritten for /shop/purchases (po-* testids) after the admin create-modal
 * path was retired (eHealthwares-Informatics/ui#70). Covers:
 *   TC-SHOP-PO-01  Select Supplier
 *   TC-SHOP-PO-02  Select Warehouse
 *   TC-SHOP-PO-03  Enter items + ordered quantity
 *   TC-SHOP-PO-04  Save draft PO → PO number generated/visible
 *   TC-SHOP-PO-05  Submit from draft + direct-submit path
 *   TC-SHOP-PO-06  Load a PO from the purchase-orders select
 *   TC-SHOP-PO-07  Receipt number, received qty, unit cost; confirm total
 *   TC-SHOP-PO-08  Receive each line individually
 *   TC-SHOP-PO-09  Receive all at once
 * Plus a regression check that /rxsoft/purchases no longer exposes header-new.
 *
 * Selectors are testid-first (po-*). Known gaps (no testids in shop PO code —
 * follow-up per ui constraints): ItemSearchSelect does not forward its
 * `po-line-item-select` prop to the DOM (placeholder "Select item" fallback);
 * per-line Receive and Set-price ActionIcons carry no testid (lucide svg class
 * fallback); Set-price modal Price input has no testid (label fallback).
 *
 * Self-setup: readOrgState() for org parties/warehouses context; resolve
 * supplier/warehouse/items via GET /suppliers|/warehouses|/items (the exact
 * endpoints the PO toolbar queries); API-create only what's missing.
 * Honest test.skip when prerequisites cannot be resolved.
 */

const TS = Date.now().toString(36);
const receiptNo = `GR-SHOP-${TS}`;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type ListRow = { id: string; name: string; code?: string };

test.describe.serial('RxSoft shop purchases (PO flow)', () => {
  test.setTimeout(120_000);

  // ── Resolved prerequisites ───────────────────────────────────
  let supplierId = '';
  let supplierName = '';
  let warehouseId = '';
  let warehouseName = '';
  let item1: ListRow | null = null;
  let item2: ListRow | null = null;
  let accessToken: string | null = null;

  // Resources created by this suite (teardown deletes only these).
  let createdSupplierId = '';
  let createdWarehouseId = '';
  const createdItemIds: string[] = [];

  // POs created through the UI, keyed by flow step.
  let draftPoId = '';
  let draftPoNumber = '';
  let directPoId = '';
  let directPoNumber = '';
  let receiveAllPoId = '';
  let receiveAllPoNumber = '';

  // ── Helpers ──────────────────────────────────────────────────

  /** Mantine Select (testid lands on the input): click → search → pick option. */
  async function pickSelectOption(
    page: import('@playwright/test').Page,
    testId: string,
    searchText: string,
    optionName: RegExp | string
  ) {
    const select = page.getByTestId(testId);
    await expect(select).toBeVisible({ timeout: 15_000 });
    await select.click();
    await select.fill(searchText);
    const opt = page.getByRole('option', { name: optionName }).first();
    await expect(opt).toBeVisible({ timeout: 15_000 });
    await opt.click();
  }

  /** Item picker: `po-line-item-select` testid is NOT in the DOM (ItemSearchSelect
   *  does not forward it) — placeholder fallback within the given lines row. */
  async function pickItemOnLine(
    page: import('@playwright/test').Page,
    rowIndex: number,
    item: ListRow
  ) {
    const row = page.getByTestId('po-lines-table').locator('tbody tr').nth(rowIndex);
    const input = row.getByPlaceholder('Select item');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.click();
    await input.fill(item.name || item.code || item.id);
    const opt = page
      .getByRole('option', { name: new RegExp(escapeRegex(item.name || item.code || item.id)) })
      .first();
    await expect(opt).toBeVisible({ timeout: 15_000 });
    await opt.click();
  }

  async function fillNumberInput(locator: import('@playwright/test').Locator, value: string) {
    await expect(locator).toBeVisible({ timeout: 15_000 });
    await locator.click({ clickCount: 3 });
    await locator.press('Backspace');
    await locator.fill(value);
    await locator.press('Tab');
  }

  function lineInput(
    page: import('@playwright/test').Page,
    rowIndex: number,
    testId: string
  ): import('@playwright/test').Locator {
    return page.getByTestId('po-lines-table').locator('tbody tr').nth(rowIndex).getByTestId(testId);
  }

  /** Load a PO from the purchase-orders (pending) select by its number. */
  async function loadPoFromSelect(
    page: import('@playwright/test').Page,
    poNumber: string
  ): Promise<void> {
    await pickSelectOption(page, 'po-pending-select', poNumber, new RegExp(escapeRegex(poNumber)));
    await expect(page.getByTestId('po-pending-select')).toHaveValue(
      new RegExp(escapeRegex(poNumber)),
      { timeout: 15_000 }
    );
  }

  /** Build a 2-line PO on a fresh tab and submit it directly (no draft save). */
  async function buildAndDirectSubmitPo(
    page: import('@playwright/test').Page
  ): Promise<{ id: string; number: string }> {
    if (!item1 || !item2) {
      test.skip(true, 'two items required for the multi-line PO flow');
    }
    await pickSelectOption(
      page,
      'po-supplier-select',
      supplierName,
      new RegExp(escapeRegex(supplierName))
    );
    await pickSelectOption(
      page,
      'po-warehouse-select',
      warehouseName,
      new RegExp(escapeRegex(warehouseName))
    );
    await pickItemOnLine(page, 0, item1!);
    await fillNumberInput(lineInput(page, 0, 'po-line-ordered-qty'), '10');
    await page.getByTestId('po-add-line').click();
    await pickItemOnLine(page, 1, item2!);
    await fillNumberInput(lineInput(page, 1, 'po-line-ordered-qty'), '5');

    const postResponse = page.waitForResponse(
      (res) => /\/api\/purchases(\?.*)?$/.test(res.url()) && res.request().method() === 'POST',
      { timeout: 25_000 }
    );
    await page.getByTestId('po-submit-approve-btn').click();
    const res = await postResponse;
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      invoiceNumber?: string;
      purchaseOrderNumber?: string;
    };
    expect(res.status(), `POST /purchases failed (direct submit)`).toBeLessThan(400);
    expect(body.status, 'direct submit should create an approved PO').toBe('approved');
    const poNumber = body.invoiceNumber || body.purchaseOrderNumber || '';
    expect(poNumber, 'POST /purchases response must carry a PO number').toBeTruthy();
    await expect(page.getByTestId('po-summary-status')).toContainText('approved', {
      timeout: 15_000,
    });
    return { id: body.id!, number: poNumber };
  }

  /** Enter receipt number + received qty + unit cost on the two lines, assert totals. */
  async function enterReceiptAndLineValues(page: import('@playwright/test').Page): Promise<void> {
    await page.getByTestId('po-receipt-input').fill(receiptNo);
    // Line 1: ordered 10, unit cost 5, received 4 → 50.00 / 20.00
    await fillNumberInput(lineInput(page, 0, 'po-line-unit-cost'), '5');
    await fillNumberInput(lineInput(page, 0, 'po-line-received-qty'), '4');
    // Line 2: ordered 5, unit cost 2.5, received 5 → 12.50 / 12.50
    await fillNumberInput(lineInput(page, 1, 'po-line-unit-cost'), '2.5');
    await fillNumberInput(lineInput(page, 1, 'po-line-received-qty'), '5');

    // PoSummary recomputes totals from line unitCost/receivedQty client-side.
    const orderedTotal = page.locator('h4').filter({ hasText: 'Ordered Total' });
    const receivedTotal = page.locator('h4').filter({ hasText: 'Received Total' });
    await expect(orderedTotal).toContainText('62.50', { timeout: 10_000 });
    await expect(receivedTotal).toContainText('32.50', { timeout: 10_000 });
  }

  /** Per-line receive button: green Check ActionIcon (no testid — svg fallback). */
  function receiveLineButton(
    page: import('@playwright/test').Page,
    rowIndex: number
  ): import('@playwright/test').Locator {
    return page
      .getByTestId('po-lines-table')
      .locator('tbody tr')
      .nth(rowIndex)
      .locator('button')
      .filter({ has: page.locator('svg.lucide-check') });
  }

  async function fetchPo(
    page: import('@playwright/test').Page,
    id: string
  ): Promise<{
    status?: string;
    invoiceNumber?: string;
    lines?: Array<{ itemId: string; receivedQty?: number }>;
  }> {
    return apiFetch(page, `/purchases/${id}`);
  }

  // ── Teardown ─────────────────────────────────────────────────

  test.afterAll(async () => {
    // apiFetch needs a page-shaped evaluate; reuse the captured token instead of
    // a live page (afterAll runs outside test fixtures).
    const shim = { evaluate: async () => accessToken };
    const del = (path: string) => apiFetch(shim, path, { method: 'DELETE' }).catch(() => undefined);

    for (const id of [draftPoId, directPoId, receiveAllPoId]) {
      if (id) await del(`/purchases/${id}`);
    }
    for (const id of createdItemIds) {
      await del(`/items/${id}`);
    }
    if (createdWarehouseId) await del(`/warehouses/${createdWarehouseId}`);
    if (createdSupplierId) await del(`/suppliers/${createdSupplierId}`);
  });

  // ── 0. Self-setup ────────────────────────────────────────────

  test('self-setup: resolves supplier, warehouse, and items', async ({ page }) => {
    const org = readOrgState();

    // Supplier: the PO toolbar queries GET /suppliers — prefer whatever that
    // endpoint returns (provisioned orgs ship supplier parties per org-state).
    const suppliersRes = await apiFetch<{ data?: ListRow[] }>(page, '/suppliers?limit=10');
    let suppliers = suppliersRes.data ?? [];
    if (suppliers.length === 0 && org?.parties?.length) {
      const party = org.parties.find((p) => p.partyType === 'supplier');
      if (party) {
        const byName = await apiFetch<{ data?: ListRow[] }>(
          page,
          `/suppliers?search=${encodeURIComponent(party.name)}&limit=5`
        );
        suppliers = byName.data ?? [];
      }
    }
    if (suppliers.length === 0) {
      try {
        const created = await apiFetch<ListRow>(page, '/suppliers', {
          method: 'POST',
          body: JSON.stringify({ name: `E2E PO Supplier ${TS}` }),
        });
        suppliers = [created];
        createdSupplierId = created.id;
      } catch {
        suppliers = [];
      }
    }
    test.skip(
      suppliers.length === 0,
      'no supplier available (GET /suppliers empty, org-state parties missing, POST /suppliers failed)'
    );
    supplierId = suppliers[0].id;
    supplierName = suppliers[0].name;

    // Warehouse: PO toolbar queries GET /warehouses.
    const whRes = await apiFetch<{ data?: ListRow[] }>(page, '/warehouses?limit=10');
    let warehouses = whRes.data ?? [];
    if (warehouses.length === 0) {
      try {
        const created = await apiFetch<ListRow>(page, '/warehouses', {
          method: 'POST',
          body: JSON.stringify({
            code: `WH-E2E-${TS}`,
            name: `E2E PO Warehouse ${TS}`,
            overrideCodeValidation: true,
          }),
        });
        warehouses = [created];
        createdWarehouseId = created.id;
      } catch {
        warehouses = [];
      }
    }
    test.skip(
      warehouses.length === 0,
      'no warehouse available (GET /warehouses empty and POST /warehouses failed)'
    );
    warehouseId = warehouses[0].id;
    warehouseName = warehouses[0].name;

    // Items: two distinct items for multi-line POs. Provisioned orgs ship a
    // whitelisted catalog; API-create only when fewer than two exist.
    const itemsRes = await apiFetch<{ data?: ListRow[] }>(page, '/items?limit=5');
    const items = itemsRes.data ?? [];
    item1 = items[0] ?? null;
    item2 = items[1] ?? null;
    if (!item1 || !item2) {
      try {
        const categories = await apiFetch<{ data?: Array<{ id: string }> }>(
          page,
          '/categories?limit=1'
        );
        const uoms = await apiFetch<{ data?: Array<{ id: string }> }>(page, '/uoms?limit=1');
        const categoryId = categories.data?.[0]?.id;
        const uomId = uoms.data?.[0]?.id;
        if (categoryId && uomId) {
          for (const idx of [1, 2]) {
            const existing = idx === 1 ? item1 : item2;
            if (existing) continue;
            const created = await apiFetch<ListRow>(page, '/items', {
              method: 'POST',
              body: JSON.stringify({
                name: `E2E PO Item ${TS}-${idx}`,
                categoryId,
                baseUomId: uomId,
                purchaseUomId: uomId,
                saleUomId: uomId,
              }),
            });
            createdItemIds.push(created.id);
            if (idx === 1) item1 = created;
            else item2 = created;
          }
        }
      } catch {
        /* keep whatever GET /items returned */
      }
    }
    test.skip(!item1, 'no items available for PO lines (GET /items empty and item create failed)');

    accessToken = await readAccessToken(page);
  });

  // ── TC-SHOP-PO-01 ────────────────────────────────────────────

  test('TC-SHOP-PO-01: selects a supplier on the PO builder', async ({ page }) => {
    test.skip(!supplierId, 'setup did not resolve a supplier');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    const supplierSelect = page.getByTestId('po-supplier-select');
    await expect(supplierSelect).toBeVisible({ timeout: 15_000 });
    await pickSelectOption(
      page,
      'po-supplier-select',
      supplierName,
      new RegExp(escapeRegex(supplierName))
    );
    await expect(supplierSelect).toHaveValue(supplierName, { timeout: 10_000 });
  });

  // ── TC-SHOP-PO-02 ────────────────────────────────────────────

  test('TC-SHOP-PO-02: selects a warehouse on the PO builder', async ({ page }) => {
    test.skip(!warehouseId, 'setup did not resolve a warehouse');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    const warehouseSelect = page.getByTestId('po-warehouse-select');
    await expect(warehouseSelect).toBeVisible({ timeout: 15_000 });
    await pickSelectOption(
      page,
      'po-warehouse-select',
      warehouseName,
      new RegExp(escapeRegex(warehouseName))
    );
    await expect(warehouseSelect).toHaveValue(warehouseName, { timeout: 10_000 });
  });

  // ── TC-SHOP-PO-03 ────────────────────────────────────────────

  test('TC-SHOP-PO-03: enters an item and ordered quantity', async ({ page }) => {
    test.skip(!item1, 'setup did not resolve an item');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await expect(page.getByTestId('po-lines-table')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('po-add-line')).toBeVisible();
    // Default draft tab ships one empty line — no Add Line click needed.
    await pickItemOnLine(page, 0, item1!);
    await fillNumberInput(lineInput(page, 0, 'po-line-ordered-qty'), '10');
    await expect(lineInput(page, 0, 'po-line-ordered-qty')).toHaveValue('10');
  });

  // ── TC-SHOP-PO-04 ────────────────────────────────────────────

  test('TC-SHOP-PO-04: saves a draft PO and the PO number is visible', async ({ page }) => {
    test.skip(!supplierId || !warehouseId || !item1, 'setup prerequisites missing');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await pickSelectOption(
      page,
      'po-supplier-select',
      supplierName,
      new RegExp(escapeRegex(supplierName))
    );
    await pickSelectOption(
      page,
      'po-warehouse-select',
      warehouseName,
      new RegExp(escapeRegex(warehouseName))
    );
    await pickItemOnLine(page, 0, item1!);
    await fillNumberInput(lineInput(page, 0, 'po-line-ordered-qty'), '10');

    const postResponse = page.waitForResponse(
      (res) => /\/api\/purchases(\?.*)?$/.test(res.url()) && res.request().method() === 'POST',
      { timeout: 25_000 }
    );
    await page.getByTestId('po-save-draft-btn').click();
    const res = await postResponse;
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      status?: string;
      invoiceNumber?: string;
      purchaseOrderNumber?: string;
    };
    expect(res.status(), `POST /purchases failed (save draft)`).toBeLessThan(400);
    expect(body.status).toBe('draft');
    const poNumber = body.invoiceNumber || body.purchaseOrderNumber || '';
    expect(poNumber, 'draft PO must generate a PO number').toBeTruthy();
    draftPoId = body.id!;
    draftPoNumber = poNumber;

    // PO number visible on the builder (pending select shows the new option label).
    await expect(page.getByTestId('po-summary-status')).toContainText('draft', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('po-pending-select')).toHaveValue(
      new RegExp(escapeRegex(poNumber)),
      { timeout: 15_000 }
    );

    const serverPo = await fetchPo(page, draftPoId);
    expect(serverPo.invoiceNumber || serverPo.status).toBeTruthy();
    expect(serverPo.status).toBe('draft');
  });

  // ── TC-SHOP-PO-05 ────────────────────────────────────────────

  test('TC-SHOP-PO-05a: submits the draft PO to approved', async ({ page }) => {
    test.skip(!draftPoId || !draftPoNumber, 'TC-04 did not produce a draft PO');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await loadPoFromSelect(page, draftPoNumber);
    await expect(page.getByTestId('po-status-badge')).toContainText('draft', { timeout: 10_000 });

    const putResponse = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/purchases/${draftPoId}`) && res.request().method() === 'PUT',
      { timeout: 25_000 }
    );
    await page.getByTestId('po-submit-approve-btn').click();
    const res = await putResponse;
    expect(res.status(), 'PUT /purchases/:id (submit from draft) failed').toBeLessThan(400);

    await expect(page.getByTestId('po-summary-status')).toContainText('approved', {
      timeout: 15_000,
    });
    const serverPo = await fetchPo(page, draftPoId);
    expect(serverPo.status).toBe('approved');
  });

  test('TC-SHOP-PO-05b: direct submit path skips the draft-save step', async ({ page }) => {
    test.skip(!supplierId || !warehouseId || !item1 || !item2, 'setup prerequisites missing');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    const { id, number } = await buildAndDirectSubmitPo(page);
    directPoId = id;
    directPoNumber = number;

    const serverPo = await fetchPo(page, directPoId);
    expect(serverPo.status).toBe('approved');
    expect(serverPo.invoiceNumber || serverPo.purchaseOrderNumber).toBe(directPoNumber);
  });

  // ── TC-SHOP-PO-06 ────────────────────────────────────────────

  test('TC-SHOP-PO-06: loads a PO from the purchase-orders select', async ({ page }) => {
    test.skip(!directPoId || !directPoNumber, 'TC-05b did not produce an approved PO');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await loadPoFromSelect(page, directPoNumber);

    // Toolbar badge + supplier/warehouse reflect the loaded PO.
    await expect(page.getByTestId('po-status-badge')).toContainText('approved', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('po-supplier-select')).toHaveValue(supplierName);
    await expect(page.getByTestId('po-warehouse-select')).toHaveValue(warehouseName);

    // Loaded lines render in the lines table.
    const rows = page.getByTestId('po-lines-table').locator('tbody tr');
    await expect(rows).toHaveCount(2, { timeout: 15_000 });
  });

  // ── TC-SHOP-PO-07 ────────────────────────────────────────────

  test('TC-SHOP-PO-07: enters receipt number, received qty, unit cost; confirms total', async ({
    page,
  }) => {
    test.skip(!directPoId || !directPoNumber, 'TC-05b did not produce an approved PO');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await loadPoFromSelect(page, directPoNumber);
    await enterReceiptAndLineValues(page);

    // Receipt number bound to the tab.
    await expect(page.getByTestId('po-receipt-input')).toHaveValue(receiptNo);

    // Nothing posted yet — receive step happens in TC-08.
    const serverPo = await fetchPo(page, directPoId);
    expect(serverPo.status).toBe('approved');
  });

  // ── TC-SHOP-PO-08 ────────────────────────────────────────────

  test('TC-SHOP-PO-08: receives each line individually', async ({ page }) => {
    test.skip(!directPoId || !directPoNumber, 'TC-05b did not produce an approved PO');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    await loadPoFromSelect(page, directPoNumber);
    await enterReceiptAndLineValues(page);

    // Per-line receive: no testid on the Check ActionIcon — lucide svg fallback.
    const line1Receive = receiveLineButton(page, 0);
    await expect(line1Receive).toBeVisible({ timeout: 15_000 });
    await expect(line1Receive).toBeEnabled();
    const recv1 = page.waitForResponse(
      (res) => res.url().includes(`/api/purchases/${directPoId}/receive`),
      { timeout: 25_000 }
    );
    await line1Receive.click();
    expect((await recv1).status()).toBeLessThan(400);

    let serverPo = await fetchPo(page, directPoId);
    expect(serverPo.status, 'status after first line receive').toBe('partially_received');
    const line1 = serverPo.lines?.find((l) => l.itemId === item1!.id);
    expect(line1?.receivedQty, 'line 1 received qty posted individually').toBe(4);

    // Second line — still receivable while status is partially_received.
    const line2Receive = receiveLineButton(page, 1);
    await expect(line2Receive).toBeVisible({ timeout: 15_000 });
    const recv2 = page.waitForResponse(
      (res) => res.url().includes(`/api/purchases/${directPoId}/receive`),
      { timeout: 25_000 }
    );
    await line2Receive.click();
    expect((await recv2).status()).toBeLessThan(400);

    serverPo = await fetchPo(page, directPoId);
    const line2 = serverPo.lines?.find((l) => l.itemId === item2!.id);
    expect(line2?.receivedQty, 'line 2 received qty posted individually').toBe(5);
    expect(['partially_received', 'received']).toContain(serverPo.status);
  });

  // ── TC-SHOP-PO-09 ────────────────────────────────────────────

  test('TC-SHOP-PO-09: receives all lines at once, skipping per-line receive', async ({ page }) => {
    test.skip(!supplierId || !warehouseId || !item1 || !item2, 'setup prerequisites missing');
    await page.goto('/shop/purchases', { timeout: 60_000 });

    // Fresh 2-line PO via direct submit (skips per-line receive entirely).
    const { id, number } = await buildAndDirectSubmitPo(page);
    receiveAllPoId = id;
    receiveAllPoNumber = number;

    await page.getByTestId('po-receipt-input').fill(receiptNo);
    await fillNumberInput(lineInput(page, 0, 'po-line-unit-cost'), '5');
    await fillNumberInput(lineInput(page, 0, 'po-line-received-qty'), '10');
    await fillNumberInput(lineInput(page, 1, 'po-line-unit-cost'), '2.5');
    await fillNumberInput(lineInput(page, 1, 'po-line-received-qty'), '5');

    const receiveAll = page.getByTestId('po-receive-all-btn');
    await expect(receiveAll).toBeVisible({ timeout: 15_000 });
    await expect(receiveAll).toBeEnabled();

    // handleReceiveAll fires one POST per receivable line without awaiting —
    // wait for both receive responses, then confirm server-side receipt.
    const recvResponses: number[] = [];
    const recvWatcher = page.waitForResponse(
      (res) => res.url().includes(`/api/purchases/${receiveAllPoId}/receive`),
      { timeout: 25_000 }
    );
    await receiveAll.click();
    recvResponses.push((await recvWatcher).status());
    // Second line receive (best-effort wait — both lines are receivable).
    try {
      const recv2 = await page.waitForResponse(
        (res) => res.url().includes(`/api/purchases/${receiveAllPoId}/receive`),
        { timeout: 10_000 }
      );
      recvResponses.push(recv2.status());
    } catch {
      /* single-fire acceptable if backend merged — server status is authoritative */
    }
    for (const status of recvResponses) {
      expect(status, 'receive-all POST failed').toBeLessThan(400);
    }

    // Poll the server until the PO reaches a received-ish status.
    let serverPo = await fetchPo(page, receiveAllPoId);
    const deadline = Date.now() + 20_000;
    while (
      serverPo.status !== 'received' &&
      serverPo.status !== 'partially_received' &&
      Date.now() < deadline
    ) {
      await page.waitForTimeout(500);
      serverPo = await fetchPo(page, receiveAllPoId);
    }
    expect(serverPo.status, 'PO status after receive-all').toBe('received');
    const r1 = serverPo.lines?.find((l) => l.itemId === item1!.id);
    const r2 = serverPo.lines?.find((l) => l.itemId === item2!.id);
    expect(r1?.receivedQty).toBe(10);
    expect(r2?.receivedQty).toBe(5);

    // UI reflects the received state.
    await expect(page.getByTestId('po-summary-status')).toContainText('received', {
      timeout: 15_000,
    });
  });

  // ── Regression: admin create entry retired (ui#70) ───────────

  test('admin purchases page no longer exposes the New/create entry (ui#70)', async ({ page }) => {
    await page.goto('/rxsoft/purchases');

    // List/view path stays intact…
    await expect(page.getByTestId('page-title')).toHaveText('Purchases');
    await expect(page.getByTestId('header-search')).toBeVisible();
    for (const header of ['PO/Invoice', 'Supplier', 'Warehouse', 'Total Cost', 'Status', 'Lines']) {
      await expect(page.locator('th').filter({ hasText: header })).toBeVisible();
    }
    // …but the create entry point is gone (canCreate: false on purchasesConfig).
    await expect(page.getByTestId('header-new')).toBeHidden();
  });
});
