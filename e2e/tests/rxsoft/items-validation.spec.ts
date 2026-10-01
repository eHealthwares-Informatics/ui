import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { CrudShellPage } from '../../page-objects/crud-shell.page';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * VAL-01..04 — visible schema/business-rule validation on the items wizard
 * (tasks/schema_validation_task.md §4.2).
 *
 * The submit gate (form/submit.ts useValidatedSubmit) + step gate
 * (form/tab-groups.tsx draft transitions) must:
 *   - block invalid submits WITHOUT any network call (VAL-01)
 *   - let valid submits fire exactly one POST (VAL-02)
 *   - render a form-level error summary (VAL-03)
 *   - keep UI required flags aligned with the backend CreateItemDto (VAL-04)
 *
 * The items wizard is a full-page form (createPathBuilder → /rxsoft/items/create),
 * so these run against DataPageForm's rx-page-form anchor.
 *
 * Required step-1 fields (UI): Category, Item Name, Base UOM.
 * Async-selects need >= 2 chars before suggestions load (minChars: 2).
 */
test.describe('RxSoft Items wizard — validation gate (VAL)', () => {
  const token = `E2E Val ${Date.now().toString(36)}`;
  let crud: CrudShellPage;

  test.beforeEach(async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.setTimeout(120_000);
    crud = new CrudShellPage(page);
    await crud.goto('/rxsoft/items');
  });

  /** Counts POSTs to the items endpoint for the zero/one-POST assertions. */
  async function watchItemPosts(): Promise<{ count: () => number }> {
    let posts = 0;
    await crud.page.route('**/api/items', (route) => {
      if (route.request().method() === 'POST') posts += 1;
      return route.continue();
    });
    return { count: () => posts };
  }

  /** Opens the full-page create wizard (header New with direct-nav fallback). */
  async function openCreatePage(): Promise<void> {
    try {
      await crud.newButton.click({ timeout: 8_000 });
      await crud.page.waitForURL('**/rxsoft/items/create', { timeout: 12_000 });
    } catch {
      await crud.page.goto('/rxsoft/items/create');
    }
    await expect(crud.pageTitle('Add Item')).toBeVisible({ timeout: 30_000 });
  }

  /**
   * Fills an async-select by testid with the first query that yields options.
   * Options detach mid-click under debounce re-renders — 3× retry (C9).
   */
  async function pickSuggestion(fieldName: string, queries: string[]): Promise<void> {
    const combobox = crud.page.getByTestId(`async-select-${fieldName}`);
    await expect(combobox).toBeAttached({ timeout: 15_000 });
    for (const query of queries) {
      let clicked = false;
      for (let attempt = 0; attempt < 3 && !clicked; attempt += 1) {
        await combobox.fill(query);
        const options = crud.page.getByRole('option');
        try {
          await expect(options.first()).toBeVisible({ timeout: 6_000 });
        } catch {
          break;
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

  test('VAL-01 — empty submit is blocked: per-field errors visible, zero POSTs', async () => {
    const posts = await watchItemPosts();
    await openCreatePage();

    await crud.page.getByTestId('form-submit').click();

    const summary = crud.page.getByTestId('form-error-summary');
    await expect(summary).toBeVisible({ timeout: 10_000 });

    // The three UI-required step-1 fields each show a visible error
    await expect(crud.page.getByTestId('field-error-category')).toBeVisible();
    await expect(crud.page.getByTestId('field-error-name')).toBeVisible();
    await expect(crud.page.getByTestId('field-error-baseUom')).toBeVisible();

    // Inputs flagged aria-invalid for a11y
    await expect(crud.page.getByTestId('field-category').locator('input')).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    // The first invalid field receives focus
    await expect(crud.page.getByTestId('field-category').locator('input')).toBeFocused();

    // Validation worked exactly because no request fired
    expect(posts.count(), 'invalid submit must not POST /items').toBe(0);
  });

  test('VAL-02 — fixing the fields clears errors and fires exactly one POST', async () => {
    const posts = await watchItemPosts();
    await openCreatePage();

    // First submit invalid to render the errors we then watch disappear
    await crud.page.getByTestId('form-submit').click();
    await expect(crud.page.getByTestId('form-error-summary')).toBeVisible({ timeout: 10_000 });
    expect(posts.count()).toBe(0);

    await pickSuggestion('category', ['ca', 'ta', 'su']);
    const nameField = crud.page.getByTestId('field-name').locator('input');
    await nameField.fill(`${token} v1`);
    await pickSuggestion('baseUom', ['pi', 'bo', 'ea', 'ta']);

    // Filled fields' errors clear as the valid submit goes through
    await crud.page.getByTestId('form-submit').click();
    await expect(crud.page.getByTestId('form-error-summary')).toBeHidden({ timeout: 10_000 });

    await expect(crud.page.getByText(/record created|Item .* created/i).first()).toBeVisible({
      timeout: 30_000,
    });

    expect(posts.count(), 'valid submit must fire exactly one POST').toBe(1);
  });

  test('VAL-03 — form-level summary lists each offending field', async () => {
    await watchItemPosts();
    await openCreatePage();

    await crud.page.getByTestId('form-submit').click();

    const summary = crud.page.getByTestId('form-error-summary');
    await expect(summary).toBeVisible({ timeout: 10_000 });
    await expect(summary).toContainText('3 field(s) need attention');
    await expect(summary).toContainText('Category is required');
    await expect(summary).toContainText('Item Name (Brand/Variety) is required');
    await expect(summary).toContainText('Base UOM is required');
  });

  test('VAL-04 — UI required flags match CreateItemDto (no over-starred fields)', async ({
    request,
  }) => {
    // Source of truth: the served OpenAPI document (kept in sync with the
    // DTOs by @nestjs/swagger). If this endpoint 404s the check is skipped —
    // it must never fail silently.
    const docsRes = await request.get(`${API_BASE_URL}/docs-json`);
    test.skip(!docsRes.ok(), 'OpenAPI document unavailable — DTO parity check skipped');
    // APIResponse.json() returns a Promise — without await, .paths is undefined
    // and the parity check silently compares against [].
    const docs = await docsRes.json();
    // rxsoft prefixes paths with the global /api prefix and the requestBody is
    // a $ref into components.schemas — resolve it before reading `required`.
    const postOp = docs.paths?.['/api/items']?.post ?? docs.paths?.['/items']?.post;
    const bodySchema = postOp?.requestBody?.content?.['application/json']?.schema ?? {};
    const dtoRequired: string[] = bodySchema.required ??
      (bodySchema.$ref
        ? (docs.components?.schemas?.[bodySchema.$ref.split('/').pop()]?.required ?? [])
        : []);

    // DTO truth (CreateItemDto): name + categoryId + baseUomId required;
    // genericProductCode / purchaseUomId / saleUomId are @IsOptional.
    const UI_REQUIRED_TO_DTO = ['categoryId', 'name', 'baseUomId'];

    for (const dtoField of UI_REQUIRED_TO_DTO) {
      expect(dtoRequired, `UI marks ${dtoField} required but CreateItemDto does not`).toContain(
        dtoField
      );
    }
    for (const dtoOptional of ['genericProductCode', 'purchaseUomId', 'saleUomId']) {
      expect(
        dtoRequired,
        `CreateItemDto still requires ${dtoOptional} — UI star drift or DTO tightened`
      ).not.toContain(dtoOptional);
    }
  });

  test.afterAll(async ({ request }) => {
    const accessToken = await readAccessToken(crud.page);
    if (!accessToken) return; // public runs have no session to clean with
    const list = await request.get(`${API_BASE_URL}/items`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { search: token, limit: 5 },
    });
    const rows = (await list.json())?.data ?? [];
    const created = rows.find((r: { name?: string }) => r.name?.startsWith(token));
    if (!created?.id) return; // nothing persisted — nothing to clean
    await request.delete(`${API_BASE_URL}/items/me/${created.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  });
});
