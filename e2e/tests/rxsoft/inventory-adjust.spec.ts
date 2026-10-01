import { expect, test } from '../../fixtures/test';

/**
 * RxSoft inventory — stock adjustment workflow (Phase 3 operations).
 *
 * Uses the page's "New Stock Adjustment" inline form: pick a stock balance via
 * the combobox, set Delta Quantity, give a reason, Post Adjustment →
 * POST /inventory/adjustments. Skips when no stock balances are seeded.
 *
 * Selectors are testid-first per the e2e convention (AGENTS.md rule 1);
 * the inline form fields carry adjust-inline-* testids on the inventory page.
 */
const reason = `E2E adjust ${Date.now().toString(36)}`;

test.describe('RxSoft inventory adjustments', () => {
  test('posts an adjustment for a stock balance', async ({ page }) => {
    // Watch the adjustment endpoint: the run asserts exactly one POST
    // (VAL-style guard against silent double-fires / no-op submits).
    let adjustmentPosts = 0;
    await page.route('**/api/inventory/adjustments', (route) => {
      if (route.request().method() === 'POST') adjustmentPosts++;
      return route.continue();
    });

    await page.goto('/rxsoft/inventory');

    const balanceInput = page.getByTestId('stock-balance-search');
    await expect(balanceInput).toBeVisible();
    await balanceInput.click();

    // Bail out before interacting when nothing is seeded.
    if ((await page.getByTestId('stock-balance-option').count()) === 0) {
      test.skip(true, 'no stock balances seeded to adjust');
    }
    const option = page.getByTestId('stock-balance-option').first();
    await expect(option).toBeVisible({ timeout: 12_000 });
    await option.click();

    const quantity = page.getByTestId('adjust-inline-quantity').locator('input');
    await expect(quantity).toBeVisible();
    await quantity.fill('1');

    const reasonInput = page.getByTestId('adjust-inline-reason').locator('input');
    await expect(reasonInput).toBeVisible();
    await reasonInput.fill(reason);

    await page.getByTestId('adjust-inline-submit').click();

    await expect(page.getByText('Adjustment posted successfully.')).toBeVisible({
      timeout: 15_000,
    });
    expect(adjustmentPosts).toBe(1);
  });
});
