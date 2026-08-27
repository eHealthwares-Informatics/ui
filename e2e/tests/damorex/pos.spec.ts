import { expect, test } from '../../fixtures/test';

/**
 * Damorex POS happy path: pick a product → the sale UOM is preselected →
 * add to cart → pay → complete sale.
 *
 * Runs under the `admin` project (authenticated) because the POS uses the
 * authenticated rxsoft API. Skips when no whitelisted items are seeded.
 */
test.describe('Damorex POS', () => {
  test('adds a product to the cart, preselects its sale UOM, and completes a sale', async ({
    page,
  }) => {
    await page.goto('/damorex/pos');

    // Product entry table
    const productSelect = page.getByPlaceholder('Select product...');
    await expect(productSelect).toBeVisible();
    await productSelect.click();

    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();
    if ((await option.count()) === 0) {
      test.skip(true, 'no whitelisted items seeded for POS');
    }
    const productLabel = await option.innerText();
    await option.click();

    // Selecting a product must preselect its sale UOM in the UOM control.
    const entryUomSelect = page.getByPlaceholder('Pick UOM');
    await expect(entryUomSelect).toBeVisible();
    await expect(entryUomSelect).not.toHaveValue('', { timeout: 8_000 });
    const saleUomPreset = await entryUomSelect.inputValue();
    expect(saleUomPreset.length).toBeGreaterThan(0);

    // Add to cart → row appears in the cart table (code and name render in
    // separate cells, so match on the name part of the option label).
    const itemName = productLabel.includes(' - ') ? productLabel.slice(productLabel.indexOf(' - ') + 3) : productLabel;
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    const cartRow = page.locator('tbody tr').filter({ hasText: itemName.trim() }).first();
    await expect(cartRow).toBeVisible();
    await expect(page.getByText('Items on Cart').locator('..')).toBeVisible();

    // Pay via the modal.
    await page.getByRole('button', { name: 'Sell Only' }).click();

    const paymentDialog = page.getByRole('dialog', { name: 'Payment' });
    await expect(paymentDialog).toBeVisible();

    const methodSelect = paymentDialog.getByPlaceholder('Select method');
    await methodSelect.click();
    const methodOption = page.getByRole('option').first();
    await expect(methodOption).toBeVisible();
    await methodOption.click();

    await paymentDialog.getByRole('button', { name: 'Complete Sale' }).click();

    // Sale completes: the payment modal closes and "Next Customer" is enabled.
    await expect(paymentDialog).toBeHidden({ timeout: 15_000 });
    const nextCustomer = page.getByRole('button', { name: 'Next Customer' });
    await expect(nextCustomer).toBeEnabled({ timeout: 20_000 });
  });

  test('holds a sale and starts a fresh empty cart', async ({ page }) => {
    await page.goto('/damorex/pos');

    const productSelect = page.getByPlaceholder('Select product...');
    await productSelect.click();
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible();
    const productLabel = await option.innerText();
    await option.click();

    await page.getByRole('button', { name: 'Add', exact: true }).click();
    const itemName = productLabel.includes(' - ') ? productLabel.slice(productLabel.indexOf(' - ') + 3) : productLabel;
    await expect(page.locator('tbody tr').filter({ hasText: itemName.trim() }).first()).toBeVisible();

    // Hold the sale: a fresh empty session starts (the held cart is cleared).
    await page.getByRole('button', { name: 'Hold Sale' }).click();
    await expect(page.locator('tbody tr').filter({ hasText: itemName.trim() })).toHaveCount(0);
  });
});