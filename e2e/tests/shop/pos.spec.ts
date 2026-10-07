import { expect, test } from '../../fixtures/test';
import { waits, recordTiming } from '../../utils/adaptive-wait';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function pickProduct(page: import('@playwright/test').Page) {
  const productSelect = page.getByTestId('pos-product-select');
  const t0 = Date.now();
  await expect(productSelect).toBeVisible({ timeout: waits.pos.productSelect });
  await productSelect.click();

  const option = page.getByRole('option').first();
  await expect(option).toBeVisible({ timeout: waits.pos.productSelect });
  const label = await option.innerText();
  await option.click();
  recordTiming('pos:product-select', Date.now() - t0);
  return label;
}

async function addFirstProduct(page: import('@playwright/test').Page) {
  const label = await pickProduct(page);
  await page.getByTestId('pos-add-to-cart-btn').click();
  return label;
}

/**
 * Seed a single-priced cart directly into the persisted POS store, then reload.
 *
 * The offline new-customer regression (#59 / ui#63) exercises PaymentModal's
 * checkout logic, not product search. Seeding the cart here keeps the test
 * deterministic and independent of seed-data pricing (the live product picker
 * currently offers receipt-only items with "no price set").
 */
async function seedCartViaStorage(page: import('@playwright/test').Page) {
  await page.goto('/shop/pos');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    const session = {
      id: crypto.randomUUID(),
      saleCode: `QA-OFFLINE-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      discount: 0,
      vatPercent: 0,
      pricingMode: 'retail',
      held: false,
      status: 'active',
      paidAmount: 0,
      changeAmount: 0,
      customerId: null,
      customerName: '',
      cart: [
        {
          id: crypto.randomUUID(),
          orderItemId: crypto.randomUUID(),
          uomId: crypto.randomUUID(),
          quantity: 1,
          retailPrice: 50,
          wholesalePrice: 40,
        },
      ],
    };
    const raw = JSON.parse(localStorage.getItem('pos-store') || '{}');
    localStorage.setItem(
      'pos-store',
      JSON.stringify({
        ...raw,
        state: {
          ...(raw.state ?? {}),
          sessions: [session],
          activeSessionId: session.id,
          offlineSaleQueue: [],
        },
      })
    );
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pos-sell-only-btn')).toBeEnabled({ timeout: waits.visible });
}

/* ------------------------------------------------------------------ */
/*  POS — happy-path and edge-case tests                              */
/* ------------------------------------------------------------------ */

test.describe('Damorex POS', () => {
  /* ---- Cart is empty by default ---- */

  test('shows empty cart message initially', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Cart is empty')).toBeVisible({
      timeout: waits.pos.cartUpdate,
    });
  });

  /* ---- Add a product to cart ---- */

  test('adds a product to the cart and shows it in the cart table', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    const productLabel = await addFirstProduct(page);

    const itemName = productLabel.includes(' - ')
      ? productLabel.slice(productLabel.indexOf(' - ') + 3)
      : productLabel;
    const cartRow = page
      .locator('table')
      .last()
      .locator('tbody tr')
      .filter({ hasText: itemName.trim() })
      .first();
    await expect(cartRow).toBeVisible({ timeout: waits.pos.cartUpdate });

    // Summary panel visible, cart no longer empty.
    await expect(page.getByTestId('pos-sales-summary')).toBeVisible({
      timeout: waits.visible,
    });
    await expect(page.getByText('Cart is empty')).toHaveCount(0);
  });

  /* ---- Hold sale ---- */

  test('holds a sale and starts a fresh empty cart', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    const productLabel = await addFirstProduct(page);
    const itemName = productLabel.includes(' - ')
      ? productLabel.slice(productLabel.indexOf(' - ') + 3)
      : productLabel;
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName.trim() }).first()
    ).toBeVisible({ timeout: waits.pos.cartUpdate });

    await page.getByTestId('pos-hold-sale-btn').click();
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName.trim() })
    ).toHaveCount(0, { timeout: waits.pos.cartUpdate });
  });

  /* ---- Remove item from cart ---- */

  test('removes an item from the cart', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    const productLabel = await addFirstProduct(page);
    const itemName = productLabel.includes(' - ')
      ? productLabel.slice(productLabel.indexOf(' - ') + 3)
      : productLabel;
    const cartRow = page
      .locator('table')
      .last()
      .locator('tbody tr')
      .filter({ hasText: itemName.trim() })
      .first();
    await expect(cartRow).toBeVisible({ timeout: waits.pos.cartUpdate });

    await cartRow.locator('button').last().click();
    await expect(page.getByText('Cart is empty')).toBeVisible({
      timeout: waits.pos.cartUpdate,
    });
  });

  /* ---- Payment modal tests ---- */

  test('Sell Only opens the payment modal', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    await addFirstProduct(page);
    await page.getByTestId('pos-sell-only-btn').click();

    // The payment modal renders as a Mantine Dialog.
    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    // Modal content is present.
    await expect(page.getByTestId('pos-payment-method')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('pos-complete-sale-btn')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('pos-cancel-payment-btn')).toBeVisible({
      timeout: waits.visible,
    });

    await page.getByTestId('pos-cancel-payment-btn').click();
  });

  test('Sell and Print opens payment modal', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    await addFirstProduct(page);
    await page.getByTestId('pos-sell-print-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await page.getByTestId('pos-cancel-payment-btn').click();
    await expect(dialog).toBeHidden({ timeout: waits.visible });
  });

  test('Sell and Print Wholesale opens payment modal', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    await addFirstProduct(page);
    await page.getByTestId('pos-sell-wholesale-btn').click();

    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    await page.getByTestId('pos-cancel-payment-btn').click();
    await expect(dialog).toBeHidden({ timeout: waits.visible });
  });

  test('payment modal shows correct total and balance', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    await addFirstProduct(page);
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

  /* ---- Offline new-customer regression (#59 / ui#63, PR #62) ---- */

  test('offline sale with a NEW customer continues as walk-in and queues the sale', async ({
    page,
  }) => {
    await seedCartViaStorage(page);

    await page.getByTestId('pos-sell-only-btn').click();
    const dialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(dialog).toBeVisible({ timeout: waits.pos.paymentModal });

    // Cash method so completion needs no terminal/wallet side effects.
    await page.getByTestId('pos-payment-method').click();
    await page.getByRole('option').first().click();

    // Type a NEW customer (no session customer) — this is the #59 path.
    const newCustomerName = `Offline QA ${Date.now().toString(36)}`;
    await page.getByTestId('pos-customer-name').fill(newCustomerName);

    // Simulate the backend being unreachable at the transport level while the
    // browser stays "online" (navigator.onLine === true). We deliberately do
    // NOT use context.setOffline(): TanStack Query v5 defaults to
    // networkMode 'online' and PAUSES mutations when navigator.onLine is false,
    // so mutateAsync never rejects and the #59 path is never reached. That
    // true-offline gap is reported on ui#63; this regression pins the
    // "backend unreachable" path the merged fix actually targets.
    await page.route('**/api/customers', (route) => route.abort('failed'));
    await page.route('**/api/sales', (route) =>
      route.request().method() === 'POST' ? route.abort('failed') : route.continue()
    );

    await page.getByTestId('pos-complete-sale-btn').click();

    // Network failure on createCustomer must NOT block the sale — the offline
    // prompt offers queueing instead.
    const offlinePrompt = page.getByTestId('pos-offline-prompt');
    await expect(offlinePrompt).toBeVisible({ timeout: 20_000 });

    // Queue the sale offline (walk-in).
    await page.getByTestId('pos-complete-offline-btn').click();

    // The persisted queue entry must carry the original saleCode and a null
    // customerId (walk-in), proving the sale continued without the customer.
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

  test('customer business error still blocks the sale (no offline prompt)', async ({ page }) => {
    await seedCartViaStorage(page);

    // Simulate a 4xx business rejection from createCustomer (e.g. duplicate phone).
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

    // Sale POST must never fire for a business error.
    let salePosts = 0;
    await page.route('**/api/sales', (route) => {
      if (route.request().method() === 'POST') salePosts += 1;
      return route.continue();
    });

    await page.getByTestId('pos-complete-sale-btn').click();

    // No offline prompt — the sale is blocked, not queued.
    await expect(page.getByTestId('pos-offline-prompt')).toHaveCount(0, { timeout: 5_000 });
    expect(salePosts, 'business error must not POST a sale').toBe(0);
  });
});
