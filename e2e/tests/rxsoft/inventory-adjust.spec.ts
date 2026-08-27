import { expect, test } from '../../fixtures/test';

/**
 * RxSoft inventory — stock adjustment workflow (Phase 3 operations).
 *
 * Uses the page's "New Stock Adjustment" form: pick a stock balance via the
 * combobox, set Delta Quantity, give a reason, Post Adjustment →
 * POST /inventory/adjustments. Skips when no stock balances are seeded.
 */
const reason = `E2E adjust ${Date.now().toString(36)}`;

test.describe('RxSoft inventory adjustments', () => {
  test('posts an adjustment for a stock balance', async ({ page }) => {
    await page.goto('/rxsoft/inventory');

    // Hide the dev "ToastStack" overlay which intercepts centered clicks.
    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    const balanceInput = page.getByPlaceholder('Search stock balance...');
    await expect(balanceInput).toBeVisible();
    await balanceInput.click();

    const option = page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 12_000 });
    if ((await page.getByRole('option').count()) === 0) {
      test.skip(true, 'no stock balances seeded to adjust');
    }
    await option.click();

    await page.getByLabel('Delta Quantity').fill('1');
    await page.getByLabel('Reason').fill(reason);

    await page.getByRole('button', { name: 'Post Adjustment' }).click();

    await expect(page.getByText('Adjustment posted successfully.')).toBeVisible({
      timeout: 15_000,
    });
  });
});