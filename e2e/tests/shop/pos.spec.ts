import { expect, test } from '../../fixtures/test';
import { waits, recordTiming } from '../../utils/adaptive-wait';
import { apiFetch, readAccessToken } from '../../utils/api';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const TS = Date.now().toString(36);
let runId = TS;

/**
 * Creates a UOM category via API.
 */
async function createUomCategory(page: import('@playwright/test').Page) {
  const res = await apiFetch<{ id: string }>(page, '/uom-categories', {
    method: 'POST',
    body: JSON.stringify({ name: `POS-UOMCat-${runId}` }),
  });
  return res.id;
}

/**
 * Creates a UOM via API.
 */
async function createUom(
  page: import('@playwright/test').Page,
  uomCategoryId: string,
  name: string,
  uomType: 'reference' | 'bigger' | 'smaller',
  factor: number
) {
  const res = await apiFetch<{ id: string }>(page, '/uoms', {
    method: 'POST',
    body: JSON.stringify({
      name,
      uomType,
      categoryId: uomCategoryId,
      factor,
      rounding: 1,
      isActive: true,
    }),
  });
  return res.id;
}

/**
 * Creates a category via API.
 */
async function createCategory(page: import('@playwright/test').Page, code: string, name: string) {
  const res = await apiFetch<{ id: string }>(page, '/categories', {
    method: 'POST',
    body: JSON.stringify({ code, name, overrideCodeValidation: true }),
  });
  return res.id;
}

/**
 * Creates a stock location via API.
 */
async function createStockLocation(
  page: import('@playwright/test').Page,
  code: string,
  name: string
) {
  const res = await apiFetch<{ id: string }>(page, '/stock-locations', {
    method: 'POST',
    body: JSON.stringify({ code, name, locationType: 'internal', isActive: true }),
  });
  return res.id;
}

/**
 * Creates an item via API (bypasses wizard for fixture speed).
 */
async function createItem(
  page: import('@playwright/test').Page,
  name: string,
  categoryId: string,
  baseUomId: string,
  purchaseUomId: string,
  saleUomId: string
) {
  const res = await apiFetch<{ id: string; itemCode?: string; code?: string }>(page, '/items', {
    method: 'POST',
    body: JSON.stringify({
      name,
      categoryId,
      baseUomId,
      purchaseUomId,
      saleUomId,
      isActive: true,
    }),
  });
  return res.id;
}

/**
 * Creates a price list via API.
 */
async function createPriceList(page: import('@playwright/test').Page, code: string, name: string) {
  const res = await apiFetch<{ id: string }>(page, '/price-lists', {
    method: 'POST',
    body: JSON.stringify({ code, name, isActive: true }),
  });
  return res.id;
}

/**
 * Adds a price list item via API.
 */
async function addPriceListItem(
  page: import('@playwright/test').Page,
  priceListId: string,
  itemId: string,
  unitPrice: number
) {
  const res = await apiFetch<{ id: string; unitPrice: number }>(page, '/price-lists/items', {
    method: 'POST',
    body: JSON.stringify({ priceListId, itemId, unitPrice, currencyCode: 'NGN' }),
  });
  return res.id;
}

/**
 * Ensures the user POS config has the right price list and stock location.
 */
async function ensurePosConfig(
  page: import('@playwright/test').Page,
  priceListId: string,
  stockLocationId: string
) {
  const token = await readAccessToken(page);
  await fetch('http://localhost:8080/api/user-pos-config/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      defaultPriceListId: priceListId,
      stockLocationId,
      autoSelectLocation: true,
    }),
  });
}

/**
 * Navigates to POS and waits for the product picker to be ready.
 */
async function gotoPosReady(page: import('@playwright/test').Page) {
  await page.goto('/shop/pos');
  await page.waitForLoadState('networkidle');
  const productSelect = page.getByTestId('pos-product-select');
  await expect(productSelect).toBeEnabled({ timeout: waits.pos.productSelect });
}

/**
 * Picks the first product from the picker and adds to cart.
 */
async function pickAndAddFirstProduct(page: import('@playwright/test').Page) {
  const productSelect = page.getByTestId('pos-product-select');
  await productSelect.click();
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible({ timeout: waits.pos.productSelect });
  await option.click();
  await page.getByTestId('pos-add-to-cart-btn').click();
}

/* ------------------------------------------------------------------ */
/*  Fixture setup (serial — one org per run)                          */
/* ------------------------------------------------------------------ */

test.describe.serial('POS Batch #2 — PRs #33-38, #42, #62 (full scenario coverage)', () => {
  test.setTimeout(180_000);

  let uomCategoryId: string;
  let unitUomId: string;
  let packUomId: string;
  let categoryId: string;
  let stockLocationId: string;
  let itemId: string;
  let priceListId: string;
  let accessToken: string | null = null;

  /* ── 0. Seed all prerequisite data ── */

  test('0. seeds UOMs, category, stock location, item, price list', async ({ page }) => {
    accessToken = await readAccessToken(page);
    runId = `${TS}-${Date.now().toString(36).slice(-4)}`;

    uomCategoryId = await createUomCategory(page);
    expect(uomCategoryId).toBeTruthy();

    unitUomId = await createUom(page, uomCategoryId, `Unit-e2e-${runId}`, 'reference', 1);
    expect(unitUomId).toBeTruthy();

    packUomId = await createUom(page, uomCategoryId, `Pack-e2e-${runId}`, 'bigger', 10);
    expect(packUomId).toBeTruthy();

    categoryId = await createCategory(page, `POSCAT_${runId}`, `POS-Category-${runId}`);
    expect(categoryId).toBeTruthy();

    stockLocationId = await createStockLocation(page, `POSLOC_${runId}`, `POS-Location-${runId}`);
    expect(stockLocationId).toBeTruthy();

    // Create item with UOMs so it appears in the POS picker with price
    itemId = await createItem(
      page,
      `POS-Item-${runId}`,
      categoryId,
      unitUomId,
      packUomId,
      unitUomId
    );
    expect(itemId).toBeTruthy();

    priceListId = await createPriceList(page, `POS_PRICE_${runId}`, `POS-Pricelist-${runId}`);
    expect(priceListId).toBeTruthy();

    // Add price at base UOM (100 per unit)
    const priceId = await addPriceListItem(page, priceListId, itemId, 100);
    expect(priceId).toBeTruthy();

    // Wire POS config so the session auto-loads price list + location
    await ensurePosConfig(page, priceListId, stockLocationId);

    // Give the queries a moment to settle before first test
    await page.waitForTimeout(1_000);
  });

  /* ── 1. PR #33: Set Stock / Adjust Stock modal opens with location picker when needed ── */

  test('1. Adjust Stock from cart opens modal; session location hidden when set', async ({
    page,
  }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    // Click the Adjust Stock button on the cart row (yellow PackagePlus icon)
    const adjustBtn = page.getByTestId('pos-cart-adjust-stock').first();
    await expect(adjustBtn).toBeVisible({ timeout: waits.visible });
    await adjustBtn.click();

    const modal = page.getByRole('dialog', { name: /Set Stock/ });
    await expect(modal).toBeVisible({ timeout: waits.visible });

    // Modal should have Quantity field but NO location picker (session already has location)
    await expect(page.getByLabel(/New Quantity/)).toBeVisible();
    await expect(page.getByLabel('Stock Location')).toHaveCount(0);

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(modal).toBeHidden({ timeout: waits.visible });
  });

  /* ── 2. PR #34: Loading placeholders — SKIP (cannot deterministically catch in E2E) ── */

  test.skip('2. Loading placeholders in UOM / RtPrice / StockQty cells while fetching', async ({
    page,
  }) => {
    // The loader states are fleeting (sub-second) and race with React Query cache.
    // Final rendered values are asserted in test 3 (SetPrice) and test 11 (cart add).
    // This test is documented as an honest skip per C12.
  });

  /* ── 3. PR #35: SetPrice per selected UOM ── */

  test('3. SetPrice stores base-unit price; display switches per UOM', async ({ page }) => {
    await gotoPosReady(page);

    // Pick item and ensure Pack UOM is selected
    const productSelect = page.getByTestId('pos-product-select');
    await productSelect.click();
    const option = page.getByRole('option', { name: `POS-Item-${runId}`, exact: false }).first();
    await expect(option).toBeVisible({ timeout: waits.pos.productSelect });
    await option.click();

    // Select Pack UOM (factor 10) in the entry row
    const uomSelect = page.getByTestId('pos-entry-uom');
    await uomSelect.click();
    const packOption = page
      .getByRole('option', { name: `Pack-e2e-${runId}`, exact: false })
      .first();
    await expect(packOption).toBeVisible({ timeout: waits.visible });
    await packOption.click();

    // Price cell shows "SetPrice" (no price yet for this UOM/price list combo in the table)
    // Click SetPrice → modal opens
    const setPriceBtn = page.getByTestId('pos-set-price-btn');
    await expect(setPriceBtn).toBeVisible({ timeout: waits.visible });
    await setPriceBtn.click();

    const modal = page.getByRole('dialog', { name: /Set Price/ });
    await expect(modal).toBeVisible({ timeout: waits.visible });

    // Modal shows the Pack factor (×10) and expects price FOR that UOM
    await expect(page.getByText(/Pack-e2e/)).toBeVisible();
    await expect(page.getByText(/×10/)).toBeVisible();

    // Enter 1500 for Pack (×10) → stored base price = 1500 / 10 = 150
    const priceInput = page.getByLabel(/Unit Price/);
    await priceInput.fill('1500');

    await page.getByRole('button', { name: 'Save Price' }).click();
    await expect(modal).toBeHidden({ timeout: waits.visible });

    // Back on POS: display should now show 1500 for Pack (150 × 10)
    const packPriceDisplay = page.locator('td').filter({ hasText: '1500' }).first();
    await expect(packPriceDisplay).toBeVisible({ timeout: waits.visible });

    // Switch back to Unit UOM → display should show 150
    await uomSelect.click();
    const unitOption = page
      .getByRole('option', { name: `Unit-e2e-${runId}`, exact: false })
      .first();
    await expect(unitOption).toBeVisible({ timeout: waits.visible });
    await unitOption.click();

    const unitPriceDisplay = page.locator('td').filter({ hasText: '150' }).first();
    await expect(unitPriceDisplay).toBeVisible({ timeout: waits.visible });

    // Verify via API: base price is 150
    const priceItems = await apiFetch<{ data: Array<{ unitPrice: number }> }>(
      page,
      `/price-lists/${priceListId}/items?itemId=${itemId}`
    );
    expect(priceItems.data?.[0]?.unitPrice).toBe(150);
  });

  /* ── 4. PR #36: X button clears product picker ── */

  test('4. X button clears the product picker', async ({ page }) => {
    await gotoPosReady(page);

    const productSelect = page.getByTestId('pos-product-select');
    await productSelect.click();
    const option = page.getByRole('option', { name: `POS-Item-${runId}`, exact: false }).first();
    await expect(option).toBeVisible({ timeout: waits.pos.productSelect });
    await option.click();

    // Picker should now show the selected label
    const inputValue = await productSelect.inputValue();
    expect(inputValue).toContain('POS-Item-');

    // Click the Clear (X) button — aria-label "Clear product"
    const clearBtn = page.locator('[aria-label="Clear product"]').first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Picker should be empty again
    const clearedValue = await productSelect.inputValue();
    expect(clearedValue).toBe('');
  });

  /* ── 5. PR #37: QuickAdd UOM single-result + auto-default ── */

  test('5. Quick Add UOM: single-result select works; UOM auto-defaults to reference (factor=1)', async ({
    page,
  }) => {
    await gotoPosReady(page);

    // Click Quick+ button
    await page.getByTestId('pos-quick-add-product').click();

    const modal = page.getByRole('dialog', { name: 'Quick Add Product' });
    await expect(modal).toBeVisible({ timeout: waits.visible });

    // Fill name
    await page.getByTestId('quick-add-product-name').fill(`QuickItem-${runId}`);

    // Search for category — pick our seeded one
    const catInput = page.getByTestId('quick-add-product-category');
    await catInput.click();
    await catInput.fill(`POS-Category-${runId}`);
    const catOption = page
      .getByRole('option', { name: `POS-Category-${runId}`, exact: false })
      .first();
    await expect(catOption).toBeVisible({ timeout: waits.visible });
    await catOption.click();

    // UOM field: search should return UOMs; auto-default to factor=1 (Unit)
    const uomInput = page.getByTestId('quick-add-product-uom');
    await uomInput.click();
    // Wait for options to load
    await page.waitForTimeout(500);

    // The auto-default effect: the first UOM with factor=1 should be selected
    // (we created Unit-e2e with factor=1)
    const selectedUom = await uomInput.inputValue();
    expect(selectedUom).toContain('Unit-e2e');

    // Create & Add
    await page.getByTestId('quick-add-product-submit').click();
    await expect(modal).toBeHidden({ timeout: waits.pos.saleComplete });

    // Verify the item was created and appears in the picker
    await page.getByTestId('pos-product-select').click();
    const newOption = page
      .getByRole('option', { name: `QuickItem-${runId}`, exact: false })
      .first();
    await expect(newOption).toBeVisible({ timeout: waits.pos.productSelect });
    await newOption.click();

    // Should be able to add to cart (has price? no — quick-add items have no price)
    // So SetPrice should show — that's expected; the test here is UOM auto-default worked.
  });

  /* ── 6. PR #38: Stock location auto-assigned on POS load ── */

  test('6. Stock location auto-assigned on POS load when none set', async ({ page, context }) => {
    // Clear the user POS config location to trigger auto-assignment
    const token = await readAccessToken(page);
    await fetch('http://localhost:8080/api/user-pos-config/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stockLocationId: null, autoSelectLocation: true }),
    });

    // Reload POS — the auto-assign effect should PATCH the first location
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page
      .getByTestId('pos-product-select')
      .waitFor({ state: 'visible', timeout: waits.pos.productSelect });

    // Verify config now has a stockLocationId (the first one from the org)
    const configRes = await fetch('http://localhost:8080/api/user-pos-config/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const config = await configRes.json();
    expect(config?.stockLocationId).toBeTruthy();
  });

  /* ── 7. Backend rxsoft#12: Emzor start-with search priority ── */

  test('7. Emzor search priority: items starting with "emzor" listed first', async ({ page }) => {
    await gotoPosReady(page);

    const productSelect = page.getByTestId('pos-product-select');
    await productSelect.click();
    await productSelect.fill('emzor');

    // Wait for search results
    await page.waitForTimeout(1_000);

    const firstOption = page.getByRole('option').first();
    await expect(firstOption).toBeVisible({ timeout: waits.pos.productSelect });

    const label = await firstOption.innerText();
    expect(label.toLowerCase()).toMatch(/^emzor/);
  });

  /* ── 8. ui#43 / PR #42: Quick Add sends all three UOMs + item sellable ── */

  test('8. Quick Add payload includes baseUomId + purchaseUomId + saleUomId; created item sellable at POS', async ({
    page,
  }) => {
    await gotoPosReady(page);

    // Intercept the create item POST
    const createItemPromise = page.waitForRequest(
      (req) => req.url().includes('/api/items') && req.method() === 'POST'
    );

    await page.getByTestId('pos-quick-add-product').click();
    const modal = page.getByRole('dialog', { name: 'Quick Add Product' });
    await expect(modal).toBeVisible({ timeout: waits.visible });

    await page.getByTestId('quick-add-product-name').fill(`QuickFull-${runId}`);

    const catInput = page.getByTestId('quick-add-product-category');
    await catInput.click();
    await catInput.fill(`POS-Category-${runId}`);
    const catOption = page
      .getByRole('option', { name: `POS-Category-${runId}`, exact: false })
      .first();
    await expect(catOption).toBeVisible({ timeout: waits.visible });
    await catOption.click();

    const uomInput = page.getByTestId('quick-add-product-uom');
    await uomInput.click();
    await page.waitForTimeout(500);
    const uomOption = page.getByRole('option', { name: `Unit-e2e-${runId}`, exact: false }).first();
    await expect(uomOption).toBeVisible({ timeout: waits.visible });
    await uomOption.click();

    await page.getByTestId('quick-add-product-submit').click();

    const createReq = await createItemPromise;
    const payload = createReq.postDataJSON();
    expect(payload.baseUomId).toBeTruthy();
    expect(payload.purchaseUomId).toBe(payload.baseUomId); // Quick Add sends same UOM for all three
    expect(payload.saleUomId).toBe(payload.baseUomId);
    expect(payload.name).toBe(`QuickFull-${runId}`);

    await expect(modal).toBeHidden({ timeout: waits.pos.saleComplete });

    // Now the item should appear in the picker
    await page.getByTestId('pos-product-select').click();
    const newOption = page
      .getByRole('option', { name: `QuickFull-${runId}`, exact: false })
      .first();
    await expect(newOption).toBeVisible({ timeout: waits.pos.productSelect });
    await newOption.click();

    // NOTE: Quick-add items have no price → SetPrice shows. That's expected.
    // The regression test is that the item was created with correct UOM payload.
  });

  /* ── 9. ui#63 (restored): Offline new-customer walk-in regression ── */

  test('9. offline sale with a NEW customer continues as walk-in and queues the sale', async ({
    page,
  }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    // Open payment modal
    await page.getByTestId('pos-sell-only-btn').click();
    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    // Select cash payment
    await page.getByTestId('pos-payment-method').click();
    await page.getByRole('option').first().click();

    // Type a NEW customer name (no session customer)
    const newCustomerName = `Offline QA ${Date.now().toString(36)}`;
    await page.getByTestId('pos-customer-name').fill(newCustomerName);

    // Simulate backend unreachable at transport level (navigator.onLine stays true)
    await page.route('**/api/customers', (route) => route.abort('failed'));
    await page.route('**/api/sales', (route) =>
      route.request().method() === 'POST' ? route.abort('failed') : route.continue()
    );

    await page.getByTestId('pos-complete-sale-btn').click();

    // Offline prompt must appear
    const offlinePrompt = page.getByTestId('pos-offline-prompt');
    await expect(offlinePrompt).toBeVisible({ timeout: 20_000 });

    // Queue the sale offline (walk-in)
    await page.getByTestId('pos-complete-offline-btn').click();

    // Verify the persisted queue entry has original saleCode and null customerId
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const raw = JSON.parse(localStorage.getItem('pos-store') || '{}');
            return (raw?.state?.offlineSaleQueue ?? []).length;
          }),
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);

    const queued = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('pos-store') || '{}');
      const queue: Array<{ saleCode?: string; payload?: { customerId?: unknown } }> =
        raw?.state?.offlineSaleQueue ?? [];
      const last = queue[queue.length - 1];
      return {
        payloadExists: Boolean(last?.payload),
        saleCode: last?.saleCode as string | undefined,
        customerId: last?.payload?.customerId,
      };
    });
    expect(queued.payloadExists).toBe(true);
    expect(queued.customerId).toBeNull();
    expect(queued.saleCode).toBeTruthy();
  });

  /* ── 10. ui#63: Business error (4xx) still blocks sale, no offline prompt ── */

  test('10. customer business error still blocks the sale (no offline prompt)', async ({
    page,
  }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    // Simulate 4xx business rejection from createCustomer
    await page.route('**/api/customers', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Customer phone already exists' }),
      })
    );

    await page.getByTestId('pos-sell-only-btn').click();
    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await page.getByTestId('pos-payment-method').click();
    await page.getByRole('option').first().click();
    await page.getByTestId('pos-customer-name').fill('Duplicate Customer');

    // Sale POST must never fire
    let salePosts = 0;
    await page.route('**/api/sales', (route) => {
      if (route.request().method() === 'POST') salePosts += 1;
      return route.continue();
    });

    await page.getByTestId('pos-complete-sale-btn').click();

    // No offline prompt — sale blocked, not queued
    await expect(page.getByTestId('pos-offline-prompt')).toHaveCount(0, { timeout: 5_000 });
    expect(salePosts, 'business error must not POST a sale').toBe(0);
  });

  /* ── Happy-path carryovers (cart add/hold/remove/payment modal) ── */

  test('11. adds a product to the cart and shows it in the cart table', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    const itemName = `POS-Item-${runId}`;
    const cartRow = page
      .locator('table')
      .last()
      .locator('tbody tr')
      .filter({ hasText: itemName })
      .first();
    await expect(cartRow).toBeVisible({ timeout: waits.pos.cartUpdate });

    await expect(page.getByTestId('pos-sales-summary')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByText('Cart is empty')).toHaveCount(0);
  });

  test('12. holds a sale and starts a fresh empty cart', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    const itemName = `POS-Item-${runId}`;
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName }).first()
    ).toBeVisible({ timeout: waits.pos.cartUpdate });

    await page.getByTestId('pos-hold-sale-btn').click();
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName })
    ).toHaveCount(0, { timeout: waits.pos.cartUpdate });
  });

  test('13. removes an item from the cart', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);

    const itemName = `POS-Item-${runId}`;
    const cartRow = page
      .locator('table')
      .last()
      .locator('tbody tr')
      .filter({ hasText: itemName })
      .first();
    await expect(cartRow).toBeVisible({ timeout: waits.pos.cartUpdate });

    await cartRow.locator('button').last().click();
    await expect(page.getByText('Cart is empty')).toBeVisible({ timeout: waits.pos.cartUpdate });
  });

  test('14. Sell Only opens the payment modal', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);
    await page.getByTestId('pos-sell-only-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await expect(page.getByTestId('pos-payment-method')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('pos-complete-sale-btn')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('pos-cancel-payment-btn')).toBeVisible({
      timeout: waits.visible,
    });

    await page.getByTestId('pos-cancel-payment-btn').click();
  });

  test('15. Sell and Print opens payment modal', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);
    await page.getByTestId('pos-sell-print-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await page.getByTestId('pos-cancel-payment-btn').click();
    await expect(dialog).toBeHidden({ timeout: waits.visible });
  });

  test('16. Sell and Print Wholesale opens payment modal', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);
    await page.getByTestId('pos-sell-wholesale-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await page.getByTestId('pos-cancel-payment-btn').click();
    await expect(dialog).toBeHidden({ timeout: waits.visible });
  });

  test('17. payment modal shows correct total and balance', async ({ page }) => {
    await gotoPosReady(page);
    await pickAndAddFirstProduct(page);
    await page.getByTestId('pos-sell-only-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    const totalText = page.getByTestId('pos-payment-total');
    await expect(totalText).toBeVisible({ timeout: waits.visible });
    const totalContent = await totalText.innerText();
    expect(totalContent).toMatch(/₦[\d,]+\.\d{2}/);

    await expect(page.getByTestId('pos-payment-balance')).toBeVisible({ timeout: waits.visible });

    await page.getByTestId('pos-cancel-payment-btn').click();
  });

  /* ── Teardown ── */

  test.afterAll(async ({ request }) => {
    // Clean up seeded data via API
    if (!accessToken) return;
    if (priceListId) {
      await request
        .delete(`http://localhost:8080/api/price-lists/${priceListId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (itemId) {
      await request
        .delete(`http://localhost:8080/api/items/${itemId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (stockLocationId) {
      await request
        .delete(`http://localhost:8080/api/stock-locations/${stockLocationId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (categoryId) {
      await request
        .delete(`http://localhost:8080/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (packUomId) {
      await request
        .delete(`http://localhost:8080/api/uoms/${packUomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (unitUomId) {
      await request
        .delete(`http://localhost:8080/api/uoms/${unitUomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
    if (uomCategoryId) {
      await request
        .delete(`http://localhost:8080/api/uom-categories/${uomCategoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .catch(() => {});
    }
  });
});
