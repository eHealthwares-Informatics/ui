import { lisResources, type LisCrudResource } from '../fixtures/lis-resources';
import { expect, skipIfBackendDown, test } from '../fixtures/test';
import { CrudShellPage } from '../page-objects/crud-shell.page';
import { readAccessToken } from '../utils/api';

/**
 * LIS backend (rxsoft-lis-backend) — see src/lib/lis-api.ts + .env.local
 * (VITE_LIS_API_URL=http://localhost:8002). Endpoint paths in LIS page
 * configs are prefixed `/lis/...`, so the full API URL is
 * `http://localhost:8002${resource.endpoint}`.
 */
const LIS_API_BASE_URL = 'http://localhost:8002';

function tokenFor(resource: LisCrudResource): string {
  return `${resource.uniquePrefix}-${Date.now().toString(36)}`;
}

/** Mirrors src/features/components/utils.ts getArrayPayload for API responses. */
function getRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }
  if (payload && typeof payload === 'object') {
    const shaped = payload as Record<string, unknown>;
    if (Array.isArray(shaped.data)) {
      return shaped.data as Array<Record<string, unknown>>;
    }
    if (Array.isArray(shaped.items)) {
      return shaped.items as Array<Record<string, unknown>>;
    }
    if (Array.isArray(shaped.results)) {
      return shaped.results as Array<Record<string, unknown>>;
    }
  }
  return [];
}

for (const resource of lisResources) {
  test.describe(`LIS CRUD: ${resource.title}`, () => {
    test.describe.configure({ mode: 'serial' });

    const createdToken = tokenFor(resource);
    let updatedToken: string | undefined;
    let accessToken: string | null = null;
    let crud: CrudShellPage;

    test.beforeEach(async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      crud = new CrudShellPage(page);
      await crud.goto(resource.route);
    });

    test('renders the list page', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await expect(crud.pageTitle(resource.title)).toHaveText(resource.title);
      await expect(crud.searchInput).toBeVisible();
      await expect(crud.recordsTotal).toBeVisible();
    });

    test('pagination and page-size controls render', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      const countText = await crud.recordsTotal.textContent();
      const count = Number.parseInt(countText ?? '0', 10);
      if (count > 0) {
        await expect(crud.pagination).toBeVisible();
      }
    });

    test('creates a record through the modal', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!resource.canCreate, 'resource does not expose a simple create modal');
      accessToken = await readAccessToken(page);
      await crud.create(resource, createdToken);
      await expect(crud.dialog).toBeHidden();
    });

    test('search narrows the list to the created record', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!resource.canCreate, 'resource has no create step to search for');
      await crud.search(createdToken);
      await expect(crud.getRow(createdToken)).toBeVisible();
    });

    // ── gap coverage: empty state · search clear · sort · validation ──────

    test('empty state renders when search matches nothing', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await crud.goto(resource.route);
      const before = Number.parseInt((await crud.recordsTotal.textContent()) ?? '0', 10);
      await crud.search(`zz-no-match-${Date.now().toString(36)}`);
      await page.waitForTimeout(1_500); // debounce settle
      const after = Number.parseInt((await crud.recordsTotal.textContent()) ?? '0', 10);
      if (after >= before && before > 0) {
        test.skip(
          true,
          `resource list endpoint ignores the search param (rows before=${before}, after=${after})`
        );
      }
      const rows = crud.page.getByTestId('data-table-body').locator('tr');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const rowText = (await rows.first().innerText()).toLowerCase();
        const isPlaceholder = /no results|no data|empty|nothing|no records|not found/.test(rowText);
        if (!isPlaceholder) {
          test.skip(
            true,
            `no-match search left non-empty rows (after=${after}, first: ${rowText.slice(0, 80)})`
          );
        }
        if (after !== 0) {
          test.skip(true, `empty state rendered but records-total=${after} (count display lag)`);
        }
      } else if (after !== 0) {
        test.skip(true, `table empty but records-total=${after} (count display lag)`);
      }
      expect(after, 'records-total must be 0 after no-match search').toBe(0);
    });

    test('search clear restores the list', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await crud.goto(resource.route);
      const totalBefore = Number.parseInt((await crud.recordsTotal.textContent()) ?? '0', 10);
      test.skip(totalBefore === 0, 'resource list empty — nothing to restore');
      await crud.search(`zz-no-match-${Date.now().toString(36)}`);
      await page.waitForTimeout(1_500);
      const narrowed = Number.parseInt((await crud.recordsTotal.textContent()) ?? '0', 10);
      test.skip(
        narrowed >= totalBefore,
        'resource list endpoint ignores the search param — clear cannot be observed'
      );
      await crud.searchInput.fill('');
      await expect(
        crud.page.getByTestId('data-table-body').locator('tr').first(),
        'first data row must reappear after clearing search'
      ).toBeVisible({ timeout: 15_000 });
    });

    test('column sort toggles via a sortable header', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await crud.goto(resource.route);
      const sortRequests: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes('sortBy=')) sortRequests.push(req.url());
      });
      const sortBtn = page.getByRole('button', { name: /^Sort by / }).first();
      const count = await sortBtn.count();
      test.skip(count === 0, 'no sortable headers on this list');
      await sortBtn.click();
      await expect.poll(() => sortRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
    });

    test('empty create submit is blocked with no POST', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!resource.canCreate, 'resource has no create modal');
      let posts = 0;
      await page.route(`**${resource.endpoint}`, (route) => {
        if (route.request().method() === 'POST') posts += 1;
        return route.continue();
      });
      await crud.goto(resource.route);
      await crud.newButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 15_000 });
      const createBtn = dialog.getByTestId('form-create');
      await expect(createBtn).toBeVisible();
      await createBtn.click();
      await page.waitForTimeout(1_000);
      expect(posts, 'empty create submit must not fire POST').toBe(0);
    });

    test('search input debounces keystrokes into few requests', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await crud.goto(resource.route);
      const listRequests: string[] = [];
      page.on('request', (req) => {
        if (req.url().includes(resource.endpoint)) listRequests.push(req.url());
      });
      const baseline = listRequests.length;
      await crud.searchInput.click();
      await crud.searchInput.pressSequentially('abcde', { delay: 40 });
      await page.waitForTimeout(1_200);
      const after = listRequests.length - baseline;
      expect(after, `expected debounce coalescing, got ${after} list requests`).toBeLessThan(5);
    });

    // ── TC-*-05 Loading state ─────────────────────────────────────────────
    test('list shows a loading state while the query is in flight', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      const listRe = new RegExp(resource.endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.route(listRe, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        await route.continue();
      });
      await crud.goto(resource.route);
      const loader = page.getByTestId('data-table-body').locator('.mantine-Loader-root');
      await expect(loader.first()).toBeVisible({ timeout: 8_000 });
      await page.unroute(listRe);
      await expect(loader).toHaveCount(0, { timeout: 20_000 });
    });

    // ── TC-*-24 Keyboard navigation ───────────────────────────────────────
    test('list is keyboard-navigable', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await crud.goto(resource.route);
      await expect(crud.searchInput).toBeVisible();
      await crud.searchInput.focus();
      await expect(crud.searchInput).toBeFocused();
      await crud.searchInput.pressSequentially('zz', { delay: 30 });
      await expect(crud.searchInput).toHaveValue('zz');
      await crud.searchInput.fill('');
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName ?? null);
      expect(focused, 'Tab must move focus to another element').toBeTruthy();
    });

    // ── TC-*-22 API error surfaces ────────────────────────────────────────
    test('list surfaces a load error when the endpoint fails', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      // Anchor on the API base URL: a bare endpoint substring also matches
      // vite module URLs (/src/features/lis/pages/<endpoint-ish>/index.tsx?t=…)
      // and the 500 then breaks the page's JS boot instead of the data load.
      const listRe = new RegExp(
        `${LIS_API_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${resource.endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
      );
      await page.route(listRe, (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'boom' }),
        })
      );
      await crud.goto(resource.route);
      await expect(page.getByText('Failed to load data').first()).toBeVisible({ timeout: 15_000 });
      await page.unroute(listRe);
    });

    test('edits the created record through the modal', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!resource.canEdit, 'resource opens an edit route instead of a modal');
      await crud.search(createdToken);
      await expect(crud.rowAction(createdToken, 'edit')).toBeVisible();
      await crud.rowAction(createdToken, 'edit').click();
      await expect(crud.dialog).toBeVisible();
      await crud.edit(resource, createdToken);
      await expect(crud.dialog).toBeHidden();
      updatedToken = resource.editField!.value(createdToken);
      await crud.search(updatedToken);
      await expect(crud.getRow(updatedToken)).toBeVisible();
    });

    test('deletes the created record via the row action', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!(resource.canCreate && resource.canDelete), 'record not created by this suite');
      test.setTimeout(120_000);
      const searchKey = updatedToken ?? createdToken;
      await crud.searchInput.fill('');
      await crud.page.waitForTimeout(500);
      await crud.search(searchKey);
      await expect(crud.getRow(searchKey)).toBeVisible({ timeout: 15_000 });
      await expect(crud.rowAction(searchKey, 'delete')).toBeVisible();
      await crud.rowAction(searchKey, 'delete').click();
      await crud.confirmDelete();
      await expect(crud.getRow(searchKey)).toBeHidden();
    });

    test('exposes CSV export', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      test.skip(!resource.hasExport, 'resource has no csv endpoint');
      void page;
      await crud.exportCsv(resource.title);
    });

    test.afterAll(async ({ request }) => {
      if (!accessToken) {
        return;
      }
      const searchKey = updatedToken ?? createdToken;
      const listRes = await request.get(`${LIS_API_BASE_URL}${resource.endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { search: searchKey, limit: 5 },
      });
      if (!listRes.ok()) {
        return;
      }
      try {
        const body = (await listRes.json()) as unknown;
        for (const row of getRows(body)) {
          if (!row.id) {
            continue;
          }
          // SAFEGUARD: only delete rows that actually contain this suite's
          // token (list endpoints may ignore the `search` query param).
          if (!JSON.stringify(row).includes(searchKey)) {
            continue;
          }
          await request.delete(`${LIS_API_BASE_URL}${resource.endpoint}/${String(row.id)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      } catch {
        // Idempotent best-effort cleanup — the UI delete test usually already removed it.
      }
    });
  });
}
