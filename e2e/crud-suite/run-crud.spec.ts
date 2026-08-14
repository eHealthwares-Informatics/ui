import { expect, skipIfBackendDown, test } from '../fixtures/test';
import { rxsoftResources, type RxsoftCrudResource } from '../fixtures/rxsoft-resources';
import { CrudShellPage } from '../page-objects/crud-shell.page';
import { API_BASE_URL, readAccessToken } from '../utils/api';

function tokenFor(resource: RxsoftCrudResource): string {
  return `${resource.uniquePrefix}-${Date.now().toString(36)}`;
}

/** Mirrors src/features/components/utils.ts getArrayPayload for API responses. */
function getRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (payload && typeof payload === 'object') {
    const shaped = payload as Record<string, unknown>;
    if (Array.isArray(shaped.data)) return shaped.data as Array<Record<string, unknown>>;
    if (Array.isArray(shaped.items)) return shaped.items as Array<Record<string, unknown>>;
    if (Array.isArray(shaped.results)) return shaped.results as Array<Record<string, unknown>>;
  }
  return [];
}

for (const resource of rxsoftResources) {
  test.describe(`RxSoft CRUD: ${resource.title}`, () => {
    test.describe.configure({ mode: 'serial' });

    const createdToken = tokenFor(resource);
    let updatedToken: string | undefined;
    let accessToken: string | null = null;
    let crud: CrudShellPage;

    test.beforeEach(async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      crud = new CrudShellPage(page);
      await crud.goto(resource.route);
    });

    test('renders the list page', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      await expect(page.getByRole('heading', { name: resource.title }).first()).toBeVisible();
      await expect(crud.searchInput).toBeVisible();
      await expect(crud.recordsTotal).toBeVisible();
    });

    test('pagination and page-size controls render', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      const countText = await crud.recordsTotal.textContent();
      const count = Number.parseInt(countText ?? '0', 10);
      if (count > 0) {
        await expect(crud.pagination).toBeVisible();
      }
    });

    test('creates a record through the modal', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      test.skip(!resource.canCreate, 'resource does not expose a simple create modal');
      accessToken = await readAccessToken(page);
      await crud.create(resource, createdToken);
      await expect(crud.dialog).toBeHidden();
    });

    test('search narrows the list to the created record', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      test.skip(!resource.canCreate, 'resource has no create step to search for');
      await crud.search(createdToken);
      await expect(crud.getRow(createdToken)).toBeVisible();
    });

    test('edits the created record through the modal', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      test.skip(!resource.canEdit, 'resource opens an edit route instead of a modal');
      await crud.search(createdToken);
      await expect(crud.rowAction(createdToken, 'lucide-pencil')).toBeVisible();
      await crud.rowAction(createdToken, 'lucide-pencil').click();
      await expect(crud.dialog).toBeVisible();
      await crud.edit(resource, createdToken);
      await expect(crud.dialog).toBeHidden();
      updatedToken = resource.editField!.value(createdToken);
      await crud.search(updatedToken);
      await expect(crud.getRow(updatedToken)).toBeVisible();
    });

    test('deletes the created record via the row action', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      test.skip(!(resource.canCreate && resource.canDelete), 'record not created by this suite');
      const searchKey = updatedToken ?? createdToken;
      await crud.search(searchKey);
      await expect(crud.rowAction(searchKey, 'lucide-trash-2')).toBeVisible();
      await crud.rowAction(searchKey, 'lucide-trash-2').click();
      await crud.confirmDelete();
      await expect(crud.getRow(searchKey)).toBeHidden();
    });

    test('exposes CSV export', async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'rxsoft');
      test.skip(!resource.hasExport, 'resource has no csv endpoint');
      await expect(crud.exportButton).toBeVisible();
      await crud.exportButton.click();
      await expect(page.getByText(`${resource.title} export downloaded`)).toBeVisible({ timeout: 5_000 });
    });

    test.afterAll(async ({ request }) => {
      if (!accessToken) return;
      const searchKey = updatedToken ?? createdToken;
      const listRes = await request.get(`${API_BASE_URL}${resource.endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { search: searchKey, limit: 5 },
      });
      if (!listRes.ok()) return;
      try {
        const body = (await listRes.json()) as unknown;
        for (const row of getRows(body)) {
          if (!row.id) continue;
          await request.delete(`${API_BASE_URL}${resource.endpoint}/${String(row.id)}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }
      } catch {
        // Idempotent best-effort cleanup — the UI delete test usually already removed it.
      }
    });
  });
}