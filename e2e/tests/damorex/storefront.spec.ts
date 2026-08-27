import { expect, test } from '../../fixtures/test';

/**
 * Damorex storefront browse smoke: the shop page renders the product catalogue
 * from the live backend (items with prices + images).
 */
test.describe('Damorex storefront', () => {
  test('shop page lists products with prices', async ({ page }) => {
    await page.goto('/damorex/shop');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: 15_000,
    });

    // Product cards render real items: at least one image and one Naira price.
    await expect(page.locator('img').first()).toBeVisible({ timeout: 15_000 });
    const imgCount = await page.locator('img').count();
    expect(imgCount).toBeGreaterThan(0);

    const priceVisible = page.getByText(/₦/).first();
    await expect(priceVisible).toBeVisible({ timeout: 15_000 });
  });
});