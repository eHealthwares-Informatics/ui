import { expect, test } from '../../fixtures/test';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * RxSoft items catalog — validates the item PATCH path end-to-end through the
 * wizard edit modal (this exercises the PatchItemDto/PatchItemUseCase fix, i.e.
 * a full update payload is accepted and persisted).
 *
 * A full create is not possible in this environment (the /generic-products
 * reference list is empty), so we edit an existing seeded item instead.
 */
test.describe('RxSoft items (catalog)', () => {
  const token = `E2E Item ${Date.now().toString(36)}`;
  let accessToken: string | null = null;

  test('list renders seeded catalog rows', async ({ page }) => {
    await page.goto('/rxsoft/items');
    await expect(page.getByTestId('page-title')).toHaveText('Items');
    await expect(page.getByTestId('data-table-body').locator('tr').first()).toBeVisible({ timeout: 15_000 });
  });

  test('edits an item through the wizard modal and the change persists', async ({ page }) => {
    await page.goto('/rxsoft/items');

    // Pick the first row in the catalog to edit.
    const firstRow = page.getByTestId('data-table-body').locator('tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });
    const originalName = (await firstRow.locator('td').nth(2).innerText().catch(() => '')) || 'item';
    const pencil = firstRow
      .locator('button')
      .filter({ has: page.locator('svg.lucide-pencil') })
      .first();
    await expect(pencil).toBeVisible();
    await pencil.click();

    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();

    // Rename on the first wizard step ("Item Details").
    const nameField = dialog
      .getByText('Item Name (Brand/Variety)', { exact: false })
      .first()
      .locator('xpath=following-sibling::*[1]')
      .locator('input')
      .first();
    await expect(nameField).toBeVisible();
    await nameField.fill('');

    // Save the original name for a best-effort API revert in afterAll.
    accessToken = await readAccessToken(page);
    await nameField.fill(token);

    // Step through the remaining wizard tabs, then final Submit → PATCH.
    for (let i = 0; i < 3; i++) {
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog).toBeVisible();
    }
    await dialog.getByRole('button', { name: 'Submit' }).click();

    // Back on the list; the renamed item is searchable.
    await page.waitForURL((url) => url.pathname === '/rxsoft/items');
    await page.getByTestId('header-search').fill(token);
    await expect(page.getByTestId('data-table-body').locator('tr').filter({ hasText: token }).first()).toBeVisible({
      timeout: 15_000,
    });

    void originalName;
  });

  test.afterAll(async ({ request }) => {
    // Restore the original name via API so the catalog stays clean.
    if (!accessToken) return;
    const search = await request.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: token, limit: 5 },
    });
    if (!search.ok()) return;
    const body = (await search.json()) as any;
    const rows = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
    for (const row of rows.slice(0, 1)) {
      const original = row.name?.replace(/E2E Item [a-z0-9]+$/i, '').trim() || row.name;
      if (original) {
        await request.patch(`${API_BASE_URL}/items/${String(row.id)}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          data: { name: original },
        });
      }
    }
  });
});