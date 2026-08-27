import { expect, test } from '../../fixtures/test';

/**
 * RxSoft inventory — stock transfer between locations.
 *
 * Finds a Stock Balances row with available quantity > 0, opens its Transfer
 * modal, picks a destination location and quantity 1, transfers, and asserts
 * the success toast (POST /inventory/transfers).
 */
test.describe('RxSoft inventory transfers', () => {
  test('transfers stock to another location', async ({ page }) => {
    await page.goto('/rxsoft/inventory');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    // Scope to the Stock Balances table (header cell "On Hand").
    const onHandHeader = page.locator('th').filter({ hasText: 'On Hand' }).first();
    await expect(onHandHeader).toBeVisible({ timeout: 15_000 });
    const balancesTable = onHandHeader.locator('xpath=ancestor::table[1]');

    // Pick the first row with available quantity > 0 (available = td[5]).
    const rows = balancesTable.locator('tbody tr');
    const rowCount = await rows.count();
    let targetIndex = -1;
    for (let i = 0; i < rowCount; i++) {
      const avail = Number(await rows.nth(i).locator('td').nth(5).innerText().catch(() => '0'));
      if (avail > 0) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex < 0) {
      test.skip(true, 'no stock balances with available quantity to transfer');
    }
    const targetRow = rows.nth(targetIndex);

    const transferIcon = targetRow.getByTitle('Transfer');
    await expect(transferIcon).toBeVisible();
    await transferIcon.click();

    const dialog = page.getByRole('dialog', { name: 'Transfer Stock' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Destination location (source is excluded from the options).
    const destSelect = dialog.getByLabel('Destination Location');
    await destSelect.click();
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 12_000 });
    await destOption.click();

    await dialog.getByLabel('Quantity').fill('1');
    await dialog.getByRole('button', { name: 'Transfer', exact: true }).click();

    await expect(page.getByText('Stock transferred successfully.')).toBeVisible({
      timeout: 15_000,
    });
  });
});