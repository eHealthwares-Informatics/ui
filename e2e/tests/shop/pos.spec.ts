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

  test('adds a product to the cart and shows it in the cart table', async ({
    page,
  }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    const productLabel = await addFirstProduct(page);

    const itemName =
      productLabel.includes(' - ')
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
    const itemName =
      productLabel.includes(' - ')
        ? productLabel.slice(productLabel.indexOf(' - ') + 3)
        : productLabel;
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName.trim() }).first(),
    ).toBeVisible({ timeout: waits.pos.cartUpdate });

    await page.getByTestId('pos-hold-sale-btn').click();
    await expect(
      page.locator('table').last().locator('tbody tr').filter({ hasText: itemName.trim() }),
    ).toHaveCount(0, { timeout: waits.pos.cartUpdate });
  });

  /* ---- Remove item from cart ---- */

  test('removes an item from the cart', async ({ page }) => {
    await page.goto('/shop/pos');
    await page.waitForLoadState('networkidle');

    const productLabel = await addFirstProduct(page);
    const itemName =
      productLabel.includes(' - ')
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
    await expect(page.getByTestId('pos-cancel-payment-btn')).toBeVisible({ timeout: waits.visible });

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
});
