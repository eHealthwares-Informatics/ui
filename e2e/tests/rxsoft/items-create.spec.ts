import { expect, test } from '../../fixtures/test';

/**
 * RxSoft items CREATE wizard.
 *
 * Drives the standalone create page (/rxsoft/items/create):
 *   Step 0 fills Category + UOMs + unique name, Next → POST (created)
 *   Steps 1-2 (Price List / Stock) are skipped empty
 *   Step 3 (Images) Submit → final PATCH (validates the PatchItemDto fix and
 *   the "create without a generic product" path — genericProductCode is optional).
 *
 * NOTE: items have no DELETE endpoint, so the created test item persists.
 */
const token = `E2E Create ${Date.now().toString(36)}`;

async function pickOption(page: import('@playwright/test').Page, placeholder: string, query: string, option: string) {
  const input = page.getByPlaceholder(placeholder);
  await expect(input).toBeEnabled();
  await input.click();
  await input.fill(query);
  const opt = page.getByRole('option', { name: option }).first();
  await expect(opt).toBeVisible({ timeout: 12_000 });
  await opt.click();
  await expect(input).toHaveValue(option, { timeout: 8_000 });
}

test.describe('RxSoft items create (wizard)', () => {
  test('creates an item without a generic product and finalises via PATCH', async ({ page }) => {
    await page.goto('/rxsoft/items/create');

    // The dev "ToastStack" widget injects a full-screen debug overlay that
    // intercepts pointer events on centered buttons; hide it so clicks land.
    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    const categoryInput = page.getByPlaceholder('Select Category');
    await expect(categoryInput).toBeEnabled({ timeout: 20_000 });

    // Step 0 — Item Details.
    await pickOption(page, 'Select Category', 'Med', 'Medicine');

    const nameField = page
      .getByText('Item Name (Brand/Variety)', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(nameField).toBeVisible();
    await nameField.fill(token);

    await pickOption(page, 'Search base uom...', 'Each', 'Each');
    await pickOption(page, 'Search purchase uom...', 'Gram', 'Gram');
    await pickOption(page, 'Search sale uom...', 'Milli', 'Milliliter');

// First Next is "Create & Continue": the Price List tab has `waitFor: id`,
// so stepping submits the item (POST). Remaining tabs advance with plain Next.
await page.getByRole('button', { name: 'Create & Continue' }).click();
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('button', { name: 'Next' }).click();
// Final tab (Images) → Submit → PATCH finalise.
await page.getByRole('button', { name: 'Submit' }).click();

    // Back on the list; the created item is searchable.
    await page.waitForURL((url) => url.pathname === '/rxsoft/items', { timeout: 20_000 });
    await page.getByTestId('header-search').fill(token);
    await expect(page.getByTestId('data-table-body').locator('tr').filter({ hasText: token }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});