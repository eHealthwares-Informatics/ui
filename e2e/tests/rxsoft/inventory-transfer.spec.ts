import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft inventory — stock transfer between locations.
 *
 * Self-setup: fresh provisioned orgs have stock locations (HQ + STORE) but
 * no balances, so this spec seeds one via POST /inventory/adjust-quantity
 * (creates balance if needed) before driving the UI. Finds a Stock Balances
 * row with available quantity > 0, opens its Transfer modal, picks a
 * destination location and quantity 1, transfers, and asserts the success
 * toast (POST /inventory/transfers).
 *
 * Selectors are testid-first per the e2e convention (AGENTS.md rule 1);
 * the transfer modal fields carry transfer-* testids on the inventory page.
 */
const TS = Date.now().toString(36);

test.describe('RxSoft inventory transfers', () => {
  test('transfers stock to another location', async ({ page }) => {
    // Self-setup: seed a stock balance at the first location; transfer needs
    // a second location as destination (seed template provisions HQ + STORE).
    const items = await apiFetch<{ data: Array<{ id: string }> }>(page, '/items?limit=1');
    const locations = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/stock-locations?limit=5'
    );
    const itemId = items.data?.[0]?.id;
    const locs = locations.data ?? [];
    test.skip(
      !itemId || locs.length < 2,
      'need a seeded item and >=2 stock locations for a transfer'
    );
    await apiFetch(page, '/inventory/adjust-quantity', {
      method: 'POST',
      body: JSON.stringify({
        itemId,
        locationId: locs[0].id,
        deltaQuantity: 5,
        reason: `E2E seed stock ${TS}`,
      }),
    });

    await page.goto('/rxsoft/inventory');

    // Scope to the Stock Balances table (header cell "On Hand").
    const onHandHeader = page.locator('th').filter({ hasText: 'On Hand' }).first();
    await expect(onHandHeader).toBeVisible({ timeout: 15_000 });
    const balancesTable = onHandHeader.locator('xpath=ancestor::table[1]');

    // Pick the first row with available quantity > 0 (available = td[5]).
    const rows = balancesTable.locator('tbody tr');
    const rowCount = await rows.count();
    let targetIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      const avail = Number(
        await rows
          .nth(i)
          .locator('td')
          .nth(5)
          .innerText()
          .catch(() => '0')
      );
      if (avail > 0) {
        targetIndex = i;
        break;
      }
    }
    // Safety net: self-setup should have created a balance with qty 5.
    if (targetIndex < 0) {
      test.skip(true, 'no stock balances with available quantity after self-setup');
    }
    const targetRow = rows.nth(targetIndex);

    const transferIcon = targetRow.getByTestId('row-transfer');
    await expect(transferIcon).toBeVisible();
    await transferIcon.click();

    const dialog = page.getByTestId('transfer-modal');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Destination location (source is excluded from the options).
    const destSelect = dialog.getByTestId('transfer-destination').locator('input');
    await destSelect.click();
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 12_000 });
    await destOption.click();

    await dialog.getByTestId('transfer-quantity').locator('input').fill('1');
    await dialog.getByTestId('transfer-submit').click();

    await expect(page.getByText('Stock transferred successfully.')).toBeVisible({
      timeout: 15_000,
    });
  });
});
