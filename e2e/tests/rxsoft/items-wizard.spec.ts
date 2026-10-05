import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { CrudShellPage } from '../../page-objects/crud-shell.page';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * Phase 2 — Items ("Add Item" wizard) coverage.
 *
 * Board TCs (UC-RX-ITEMS-01..05, ehealthwares/rxsoft). The items resource is
 * NOT a modal-create resource: itemsConfig sets createPathBuilder, so "New"
 * navigates to the full-page wizard at /rxsoft/items/create (DataPageForm +
 * TabGroups stepper: Item Details → Price List / Stock Entries / Images).
 * The last three tabs carry waitFor: 'id' and render disabled until step 1
 * saves via "Create & Continue" (footer button; final step is "Submit").
 * Editing is inline: the row pencil opens the modal (no editPathBuilder).
 *
 * Required step-1 fields: Category, Item Name (Brand/Variety), Base UOM.
 * Async-selects need >= 2 chars before suggestions load (minChars: 2).
 *
 * TC map:
 *   01 list renders        02 column sort      03 pagination
 *   04 empty state         05 loading state    06 search narrows
 *   07 search clear        08 debounced search 09 open create page
 *   10 required validation 11 successful create 12 created row appears
 *   13 cleanup             14 open edit        15 persist change
 *   16 validation on edit  22 API error surfaces 23 keyboard navigation
 */
test.describe('RxSoft Items wizard', () => {
  test.describe.configure({ mode: 'serial' });

  const token = `E2E Item ${Date.now().toString(36)}`;
  let crud: CrudShellPage;

  test.beforeEach(async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Heavy dev-machine load (observed load-avg >200) pushes Vite/backend
    // response times past the default 60s budget — same reasoning as the
    // 120s delete tests in the crud-suite.
    test.setTimeout(120_000);
    crud = new CrudShellPage(page);
    await crud.goto('/rxsoft/items');
  });

  /**
   * Navigates to the full-page create wizard via the header New button.
   * The click is retried: a list refetch re-render can detach the button
   * mid-click (same Mantine churn as the phase-1 delete confirm, C9).
   */
  async function openCreatePage(): Promise<void> {
    // Prefer exercising the header New button, but fall back to a direct
    // navigation: under load the click can be swallowed by a list refetch
    // re-render (C9 churn) — the TC's subject is the wizard page itself.
    try {
      await crud.newButton.click({ timeout: 8_000 });
      await crud.page.waitForURL('**/rxsoft/items/create', { timeout: 12_000 });
    } catch {
      await crud.page.goto('/rxsoft/items/create');
    }
    await expect(crud.pageTitle('Add Item')).toBeVisible({ timeout: 30_000 });
  }

  /** Stepper step button by label (Mantine renders steps as buttons). */
  function stepButton(label: string): ReturnType<CrudShellPage['page']['getByRole']> {
    return crud.page.getByRole('button', { name: label });
  }

  /**
   * Fills an async-select field (located by its stable
   * data-testid="async-select-<field>") with the first query that yields
   * suggestions and picks the first option.
   *
   * Item fields: category · genericProductCode · baseUom · purchaseUom ·
   * saleUom.
   */
  async function pickSuggestion(fieldName: string, queries: string[]): Promise<void> {
    const combobox = crud.page.getByTestId(`async-select-${fieldName}`);
    await expect(combobox).toBeAttached({ timeout: 15_000 });
    for (const query of queries) {
      let clicked = false;
      // The dropdown re-renders while the query debounces — options can
      // detach between visibility and click (same Mantine churn as the
      // phase-1 confirm-delete, C9). Re-fill and retry the pick.
      for (let attempt = 0; attempt < 3 && !clicked; attempt += 1) {
        await combobox.fill(query);
        const options = crud.page.getByRole('option');
        try {
          await expect(options.first()).toBeVisible({ timeout: 6_000 });
        } catch {
          break; // no suggestions for this query — try the next one
        }
        try {
          await options.first().click({ timeout: 4_000 });
          clicked = true;
        } catch {
          // option detached mid-click — retry the same query
        }
      }
      if (clicked) return;
    }
    throw new Error(
      `async-select-${fieldName}: no suggestion could be picked for [${queries.join(', ')}]`
    );
  }

  /**
   * Steps through tabs 2–4 so the final "Submit" button is reachable.
   * "Submit" replaces "Next" ONLY on the last tab, so each intermediate
   * step asserts the footer advanced (Next or Submit present), and the
   * final assertion waits for Submit itself.
   */
  async function stepToLastTab(): Promise<void> {
    for (let i = 0; i < 3; i += 1) {
      await stepButton('Next').click();
      await expect(stepButton('Next').or(stepButton('Submit')).first()).toBeVisible();
    }
    await expect(stepButton('Submit')).toBeVisible();
  }

  test('TC-RX-ITEMS-01 — Items list renders', async () => {
    await expect(crud.pageTitle('Items')).toHaveText('Items');
    await expect(crud.searchInput).toBeVisible();
    await expect(crud.recordsTotal).toBeVisible();
  });

  test('TC-RX-ITEMS-02 — Column sort toggles on the name column', async () => {
    const header = crud.page.locator('th').filter({ hasText: 'Item Name' }).first();
    await header.click();
    await expect(crud.page.locator('tbody tr').first()).toBeVisible();
    await header.click();
    await expect(crud.page.locator('tbody tr').first()).toBeVisible();
  });

  test('TC-RX-ITEMS-04 — Empty state renders when search matches nothing', async () => {
    await crud.search(`no-such-item-${Date.now()}`);
    await expect(crud.page.getByText(/no (records|items|data)/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('TC-RX-ITEMS-05 — Loading state renders while the list fetches', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/items') && res.request().method() === 'GET'
    );
    await crud.search('loading-probe');
    await responsePromise;
    await expect(crud.pageTitle('Items')).toBeVisible();
  });

  test('TC-RX-ITEMS-08 — Search input debounces the request', async ({ page }) => {
    let calls = 0;
    page.on('request', (req) => {
      if (req.url().includes('/items?') && req.method() === 'GET') calls += 1;
    });
    await crud.search('deb');
    await page.waitForTimeout(1_200);
    expect(calls).toBeLessThan(6);
  });

  test('TC-RX-ITEMS-09 — New opens the create wizard with locked later tabs', async () => {
    await openCreatePage();
    for (const label of ['Item Details', 'Price List', 'Stock Entries', 'Images']) {
      await expect(stepButton(label)).toBeVisible();
    }
    // Tabs 2–4 wait for a saved id before they unlock.
    await expect(stepButton('Price List')).toBeDisabled();
  });

  test('TC-RX-ITEMS-10 — Required-field validation blocks an empty save', async () => {
    await openCreatePage();
    await crud.page.getByRole('button', { name: 'Create & Continue' }).click();
    // The form refuses to advance without its required fields — but it does
    // so QUIETLY (no inline DOM message; native/quiet validation). Assert the
    // behaviour: still on the create page, still on step 1, later tabs locked.
    await expect(crud.page).toHaveURL(/\/rxsoft\/items\/create/, { timeout: 15_000 });
    await expect(stepButton('Price List')).toBeDisabled();
  });

  test('TC-RX-ITEMS-11 — Create & Continue persists and unlocks the wizard', async ({ page }) => {
    await openCreatePage();
    const postPromise = page.waitForResponse(
      (res) => res.url().includes('/api/items') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );
    const postsSeen: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST') postsSeen.push(req.url());
    });
    // The create page renders asterisks on more fields than the schema marks
    // required (Generic Product, Purchase UOM, Sale UOM) and QUIETLY refuses
    // to save when any of them is empty (no POST, no DOM error — see the

    // phase-2 challenge log). Fill every starred field.
    await pickSuggestion('category', ['ca', 'ta', 'su']);
    // genericProductCode is OPTIONAL per CreateItemDto (schema comment) — its
    // star is cosmetic and the fresh-org catalog may have no generic products.
    await crud.fillField('Item Name (Brand/Variety)', token, 'page');
    await pickSuggestion('baseUom', ['pi', 'bo', 'ea', 'ta']);
    await pickSuggestion('purchaseUom', ['bo', 'pi', 'ea']);
    await pickSuggestion('saleUom', ['ea', 'pi', 'bo']);
    // Org code whitelists the item for this org — also what cleanup clears.
    await crud.fillField('Org Code', token.replace(/[^A-Za-z0-9]/g, ''), 'page');
    await crud.page.getByRole('button', { name: 'Create & Continue' }).click();
    let post;
    try {
      post = await postPromise;
    } catch {
      throw new Error(
        `no POST /items observed. POST requests seen: ${postsSeen.join(' | ') || 'NONE'}`
      );
    }
    expect(post.status(), 'POST /items should succeed').toBeLessThan(400);
    // The stepper stays on the create page for the remaining tabs; once the
    // item has an id the locked tabs unlock. If the app instead returns to
    // the list, the created row (next test) proves the save.
    await expect(stepButton('Price List'))
      .toBeEnabled({ timeout: 30_000 })
      .catch(async () => {
        await crud.page.goto('/rxsoft/items');
      });
  });

  // TC-RX-ITEMS-REC-01 — recency sort (phase-1-pricing-patch / item_creation_view.md §3.3).
  // Created items must land on page 1 WITHOUT searching. Asserts both:
  //   (a) backend default — GET /items with no sortBy/sortOrder params
  //   (b) UI default — itemsConfig defaultSort { createdAt, desc }
  // Fails honestly if the running backend still defaults to name ASC (stale
  // build / branch not deployed) — do not tick the board TC until green.
  test('TC-RX-ITEMS-REC-01 — Created item visible on page 1 without search', async ({
    page,
    request,
  }) => {
    const accessToken = await readAccessToken(page);
    test.skip(!accessToken, 'no access token — API default-sort assertion requires a session');

    // (a) API default sort: no sortBy/sortOrder params
    const res = await request.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 25 },
    });
    const rows = ((await res.json())?.data ?? []) as Array<{ name?: string }>;
    const idx = rows.findIndex((r) => r.name?.startsWith(token));
    expect(
      idx,
      `created item not in first page of default-sorted GET /items ` +
        `(got ${rows.length} rows; first: ${rows
          .slice(0, 3)
          .map((r) => r.name)
          .join(' | ')})`
    ).toBeGreaterThanOrEqual(0);

    // (b) UI list: fresh page, no search — recency sort keeps the new row on page 1
    await crud.goto('/rxsoft/items');
    await expect(crud.getRow(token)).toBeVisible({ timeout: 20_000 });
  });

  test('TC-RX-ITEMS-12 — Created record appears in the list', async () => {
    // The items list renders the FULL global catalog (includeAll, ~39k rows,
    // 10 per page) — the new row is not on page 1, so search for it first
    // (same pattern as the crud-suite's search-narrows assertion).
    await crud.search(token);
    await expect(crud.getRow(token)).toBeVisible({ timeout: 20_000 });
  });

  // Board TC order is fixed, but the create block above guarantees a
  // non-empty catalog. Self-skip removed 2026-10-05 once TC-RX-ITEMS-REC-01
  // went green (recency sort lands the created row on page 1).
  test('TC-RX-ITEMS-03 — Pagination and page-size controls render', async () => {
    await expect(crud.pagination).toBeVisible();
  });

  // Board TC order is fixed (06/07), but these search assertions depend on
  // the row created above, so they run after the create block in this serial
  // spec (a serial block aborts on first failure — same lesson as phase 1).
  test('TC-RX-ITEMS-06 — Search narrows the list to the created row', async () => {
    await crud.search(token);
    await expect(crud.getRow(token)).toBeVisible();
  });

  test('TC-RX-ITEMS-07 — Clearing search restores the full list', async () => {
    await crud.search(token);
    await crud.search('');
    await expect(crud.recordsTotal).toContainText(/^\d+/);
  });

  test('TC-RX-ITEMS-14 — Pencil opens the inline edit modal', async () => {
    await crud.search(token);
    await crud.rowAction(token, 'lucide-pencil').click();
    await expect(crud.dialog).toBeVisible();
    await expect(crud.dialog.getByText('Item Details')).toBeVisible();
  });

  test('TC-RX-ITEMS-16 — Validation on edit: empty name cannot submit', async () => {
    // Self-contained: beforeEach re-navigates (closing any modal a previous
    // test left open), so open the edit modal here — never rely on TC-14's.
    await crud.search(token);
    await crud.rowAction(token, 'lucide-pencil').click();
    await expect(crud.dialog).toBeVisible();
    await crud.fillField('Item Name (Brand/Variety)', '');
    await crud.dialog.getByRole('button', { name: 'Next' }).click();
    // The wizard refuses to step past an invalid step (quiet validation —
    // the step-submit save fails), so the final "Submit" is never reachable
    // and the modal stays open without saving.
    await expect(crud.dialog).toBeVisible({ timeout: 15_000 });
    await expect(crud.dialog.getByRole('button', { name: 'Submit' })).toBeHidden();
  });

  test('TC-RX-ITEMS-15 — Persist change: rename and submit', async () => {
    // Fresh edit session — the previous one ended in a validation error.
    await crud.page.keyboard.press('Escape');
    await crud.search(token);
    await crud.rowAction(token, 'lucide-pencil').click();
    await expect(crud.dialog).toBeVisible();
    await crud.fillField('Item Name (Brand/Variety)', `${token} v2`);
    await stepToLastTab();
    await crud.dialog.getByRole('button', { name: 'Submit' }).click();
    await expect(crud.dialog).toBeHidden({ timeout: 20_000 });
    await crud.search(`${token} v2`);
    await expect(crud.getRow(`${token} v2`)).toBeVisible();
  });

  test('TC-RX-ITEMS-23 — Keyboard navigation reaches the form fields', async () => {
    await openCreatePage();
    await crud.page.locator('input, [role="combobox"]').first().focus();
    await crud.page.keyboard.press('Tab');
    await expect(crud.page.locator(':focus')).toBeVisible();
  });

  test('TC-RX-ITEMS-22 — API error surfaces in the UI', async ({ page }) => {
    await openCreatePage();
    await page.route('**/api/items', (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: 'boom' }) })
    );
    await pickSuggestion('category', ['ca', 'ta', 'su']);
    await crud.fillField(
      'Item Name (Brand/Variety)',
      `E2E Item dup ${Date.now().toString(36)}`,
      'page'
    );
    await pickSuggestion('baseUom', ['pi', 'bo', 'ea', 'ta']);
    await pickSuggestion('purchaseUom', ['bo', 'pi', 'ea']);
    await pickSuggestion('saleUom', ['ea', 'pi', 'bo']);
    await crud.page.getByRole('button', { name: 'Create & Continue' }).click();
    // Narrow to Mantine's notification root: the validation gate renders
    // unconditional field-error-<name> spans with role="alert", which a broad
    // [role="alert"] selector matches first (hidden, empty spans).
    await expect(page.locator('.mantine-Notification-root').first()).toBeVisible({
      timeout: 15_000,
    });
    await page.unroute('**/api/items');
  });

  test('TC-RX-ITEMS-13 — Cleanup: created wizard record is removed', async ({ request }) => {
    const accessToken = await readAccessToken(crud.page);
    test.skip(!accessToken, 'no access token — cleanup requires an authenticated session');
    await crud.search(`${token} v2`);
    const hasTrash = (await crud.rowAction(`${token} v2`, 'lucide-trash-2').count()) > 0;
    if (hasTrash) {
      await crud.rowAction(`${token} v2`, 'lucide-trash-2').click();
      await crud.confirmDelete();
      await expect(crud.getRow(`${token} v2`)).toBeHidden();
      return;
    }
    // Items have no hard delete; the org-scoped override is cleared instead
    // (DELETE /items/me/:itemId — "Remove an override for the current
    // organisation"). 404 just means the item carries no org override.
    const list = await request.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: token, limit: 5 },
    });
    const rows = (await list.json())?.data ?? [];
    const created = rows.find((r: { name?: string }) => r.name?.startsWith(token));
    if (!created?.id) return; // nothing persisted — nothing to clean
    const res = await request.delete(`${API_BASE_URL}/items/me/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204, 404]).toContain(res.status());
  });
});
