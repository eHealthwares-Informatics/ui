import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * RxSoft items CREATE wizard — UC-RX-ITEMS-WIZARD-01 (ehealthwares/rxsoft#34).
 *
 * Drives the standalone create page (/rxsoft/items/create):
 *   Step 0 fills Category + UOMs + unique name, Next → POST (created)
 *   Steps 1-2 (Price List / Stock) are skipped empty
 *   Step 3 (Images) Submit → final PATCH (validates the PatchItemDto fix and
 *   the "create without a generic product" path — genericProductCode is optional).
 *
 * Selectors are testid-first (per AGENTS.md rule 1):
 *   async selects → `async-select-<field>` / `async-option-<label>`
 *   plain fields  → `field-<name>` (RenderField)
 *   wizard footer → `form-create-continue` / `form-next` / `form-submit`
 *   Retained fallback: `getByRole('button', …)` only where copy is the subject.
 *
 * Persistence: items have no hard DELETE endpoint. The final test removes the
 * org-scoped override via `DELETE /items/me/:itemId` (same mechanism as the
 * items-wizard suite's TC-13 cleanup); the global catalog row persists by design.
 */
const token = `E2E Create ${Date.now().toString(36)}`;

/**
 * Fills an async-select by query and picks the FIRST suggestion.
 *
 * Option labels are seed data (the template's categories are e.g. "Medical
 * Advice", not the old hardcoded "Medical") so we must not pin a label: select
 * the first rendered `async-option-*` (testid-prefix, no label-proximity).
 */
async function pickOption(
  page: import('@playwright/test').Page,
  fieldName: string,
  query: string
) {
  const input = page.getByTestId(`async-select-${fieldName}`);
  await expect(input).toBeEnabled({ timeout: 20_000 });
  await input.click();
  await input.fill(query);
  // Re-click to keep dropdown open after fill
  await input.click();
  const opt = page.locator('[data-testid^="async-option-"]').first();
  await expect(opt).toBeVisible({ timeout: 15_000 });
  const label = (await opt.innerText()).trim();
  await opt.click();
  await expect(input).toHaveValue(label, { timeout: 8_000 });
}

test.describe('RxSoft items create (wizard)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.setTimeout(120_000);
    await page.goto('/rxsoft/items/create');
  });

  test('creates an item without a generic product and finalises via PATCH', async ({ page }) => {
    const categoryInput = page.getByTestId('async-select-category');
    await expect(categoryInput).toBeEnabled({ timeout: 20_000 });

    // Step 0 — Item Details.
    await pickOption(page, 'category', 'Med');

    // Plain text field — testid lives on the input itself.
    const nameField = page.locator('input[data-testid="field-name"]').first();
    await expect(nameField).toBeVisible({ timeout: 20_000 });
    await nameField.fill(token);

    await pickOption(page, 'baseUom', 'Unit');
    await pickOption(page, 'purchaseUom', 'Doz');
    await pickOption(page, 'saleUom', 'Unit');

    // First Next is "Create & Continue": the Price List tab has `waitFor: id`,
    // so stepping submits the item (POST). Remaining tabs advance with plain Next.
    await page.getByTestId('form-create-continue').click();
    await page.getByTestId('form-next').click();
    await page.getByTestId('form-next').click();
    // Final tab (Images) → Submit → PATCH finalise.
    await page.getByTestId('form-submit').click();

    // Back on the list; the created item is searchable.
    await page.waitForURL((url) => url.pathname === '/rxsoft/items', { timeout: 20_000 });
    await page.getByTestId('header-search').fill(token);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: token }).first()
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test('cleanup — removes the created item org override', async ({ page, request }) => {
    await page.goto('/rxsoft/items');
    const accessToken = await readAccessToken(page);
    test.skip(!accessToken, 'no access token — cleanup requires an authenticated session');

    const list = await request.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: token, limit: 5 },
    });
    const rows = ((await list.json())?.data ?? []) as Array<{ id?: string; name?: string }>;
    const created = rows.find((r) => r.name?.startsWith(token));
    if (!created?.id) return; // nothing persisted — nothing to clean

    const res = await request.delete(`${API_BASE_URL}/items/me/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204, 404]).toContain(res.status());
  });
});
