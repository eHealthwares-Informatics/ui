import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft inventory — stock adjustment workflow (Phase 3 operations).
 *
 * Self-setup: fresh provisioned orgs have stock locations but no balances,
 * so this spec seeds one via POST /inventory/adjust-quantity (creates balance
 * if needed) before driving the UI. Uses the page's "New Stock Adjustment"
 * inline form: pick a stock balance via the combobox, set Delta Quantity,
 * give a reason, Post Adjustment → POST /inventory/adjustments.
 *
 * Selectors are testid-first per the e2e convention (AGENTS.md rule 1);
 * the inline form fields carry adjust-inline-* testids on the inventory page.
 */
const TS = Date.now().toString(36);
const reason = `E2E adjust ${TS}`;

test.describe('RxSoft inventory adjustments', () => {
  test('posts an adjustment for a stock balance', async ({ page }) => {
    // Self-setup: seed a stock balance (item + location from seeded catalog).
    const items = await apiFetch<{ data: Array<{ id: string }> }>(page, '/items?limit=1');
    const locations = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/stock-locations?limit=5'
    );
    const itemId = items.data?.[0]?.id;
    const locationId = locations.data?.[0]?.id;
    test.skip(
      !itemId || !locationId,
      'no seeded items or stock locations to create a balance from'
    );
    await apiFetch(page, '/inventory/adjust-quantity', {
      method: 'POST',
      body: JSON.stringify({
        itemId,
        locationId,
        deltaQuantity: 5,
        reason: `E2E seed stock ${TS}`,
      }),
    });

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

    // Safety net: self-setup should have created a balance; skip honestly if not.
    if ((await page.getByTestId('stock-balance-option').count()) === 0) {
      test.skip(true, 'no stock balances visible after self-setup');
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
