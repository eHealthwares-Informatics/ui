import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { CrudShellPage } from '../../page-objects/crud-shell.page';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * VAL-01..04 — visible schema/business-rule validation on the items wizard
 * (tasks/schema_validation_task.md §4.2).
 *
 * The items create flow is a full-page MULTI-STEP wizard (DataPageForm +
 * TabGroups stepper). Step 1's footer button is "Create & Continue"
 * (data-testid="form-create-continue") — "form-submit" only renders on the
 * LAST tab. The step gate (form/tab-groups.tsx handleNext draft transition)
 * must:
 *   - block invalid step-1 submits WITHOUT any network call (VAL-01)
 *   - let valid step-1 submits fire exactly one POST (VAL-02)
 *   - render a form-level error summary (VAL-03)
 *   - keep UI required flags aligned with the backend CreateItemDto (VAL-04)
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
   * Triggers the step-1 gate. On a multi-step wizard the step-1 footer button
   * is "Create & Continue" (form-create-continue); form-submit only exists on
   * the last tab. The draft transition in tab-groups.tsx validates step-1
   * fields and blocks the POST when any required field is empty.
   */
  async function clickStepGate(): Promise<void> {
    await crud.page.getByTestId('form-create-continue').click();
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

  test('VAL-01 — empty step-1 submit is blocked: per-field errors visible, zero POSTs', async () => {
    const posts = await watchItemPosts();
    await openCreatePage();

    await clickStepGate();

    const summary = crud.page.getByTestId('form-error-summary');
    await expect(summary).toBeVisible({ timeout: 10_000 });

    // The three UI-required step-1 fields each show a visible error
    await expect(crud.page.getByTestId('field-error-category')).toBeVisible();
    await expect(crud.page.getByTestId('field-error-name')).toBeVisible();
    await expect(crud.page.getByTestId('field-error-baseUom')).toBeVisible();

    // Controls flagged aria-invalid for a11y. Testid map (testid-first):
    //   category / baseUom → async-select-<name> (LabelField drops data-testid;
    //   the Mantine InputBase input carries async-select-<name>)
    //   name              → field-name (DebouncedTextInput puts the testid on
    //   the <input> itself)
    await expect(crud.page.getByTestId('async-select-category')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(crud.page.getByTestId('field-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(crud.page.getByTestId('async-select-baseUom')).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    // The first invalid field receives focus
    await expect(crud.page.getByTestId('async-select-category')).toBeFocused();

    // Validation worked exactly because no request fired
    expect(posts.count(), 'invalid submit must not POST /items').toBe(0);
  });

  test('VAL-02 — fixing the fields clears errors and fires exactly one POST', async () => {
    const posts = await watchItemPosts();
    await openCreatePage();

    // First submit invalid to render the errors we then watch disappear
    await clickStepGate();
    await expect(crud.page.getByTestId('form-error-summary')).toBeVisible({ timeout: 10_000 });
    expect(posts.count()).toBe(0);

    await pickSuggestion('category', ['ca', 'ta', 'su']);
    // field-name sits on the <input> itself (DebouncedTextInput → Mantine
    // TextInput) — no nested input locator needed.
    await crud.page.getByTestId('field-name').fill(`${token} v1`);
    await pickSuggestion('baseUom', ['pi', 'bo', 'ea', 'ta']);

    // Filled fields' errors clear as the valid step-1 submit goes through.
    // Step-submit success signal: the wizard advances (Price List tab unlocks
    // once the draft has an id) — the step gate does not fire the mutation
    // toast, which belongs to the final-form submit path.
    await clickStepGate();
    await expect(crud.page.getByTestId('form-error-summary')).toBeHidden({ timeout: 10_000 });
    await expect(crud.page.getByRole('button', { name: 'Price List' })).toBeEnabled({
      timeout: 30_000,
    });

    expect(posts.count(), 'valid submit must fire exactly one POST').toBe(1);
  });

  test('VAL-03 — form-level summary lists each offending field', async () => {
    await watchItemPosts();
    await openCreatePage();

    await clickStepGate();

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
    // DTOs by @nestjs/swagger). The backend sets global prefix 'api', so paths
    // are /api/items (not /items); the request-body schema is a
    // { $ref: '#/components/schemas/CreateItemDto' } pointer — required[]
    // lives on the component, not inline. If the document 404s the check is
    // skipped — it must never fail silently.
    const docsRes = await request.get(`${API_BASE_URL}/docs-json`);
    test.skip(!docsRes.ok(), 'OpenAPI document unavailable — DTO parity check skipped');
    const doc = (await docsRes.json()) as {
      paths?: Record<string, any>;
      components?: { schemas?: Record<string, any> };
    };
    const schema = doc.paths?.['/api/items']?.post?.requestBody?.content?.['application/json']
      ?.schema as { $ref?: string } | undefined;
    const resolved = schema?.$ref
      ? doc.components?.schemas?.[schema.$ref.split('/').pop() ?? '']
      : schema;
    const dtoRequired: string[] = resolved?.required ?? [];

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
    // The page fixture is torn down before afterAll runs — reading localStorage
    // from crud.page throws "Target page closed". Cleanup is best-effort: the
    // provisioned org is deprovisioned at global-teardown anyway.
    let accessToken: string | null = null;
    try {
      accessToken = await readAccessToken(crud.page);
    } catch {
      return;
    }
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
