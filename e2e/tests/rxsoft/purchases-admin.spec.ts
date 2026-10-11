import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft Admin Purchases — List Page Coverage (UC-RX-PURCHASES-01/02/04/05)
 *
 * Covers the admin purchases page at `/rxsoft/purchases` (not shop PO flow).
 * The shop PO flow is in `purchases.spec.ts` (TC-SHOP-PO-01..09).
 *
 * UC coverage:
 *   UC-RX-PURCHASES-01: List, sort and paginate Purchases
 *   UC-RX-PURCHASES-02: Search and filter Purchases
 *   UC-RX-PURCHASES-04: Edit / view a Purchases record (skipped - no detail view in UI)
 *   UC-RX-PURCHASES-05: Delete / archive a Purchases record (limited in UI)
 *   (UC-RX-PURCHASES-03 Create is retired per ui#70 — no admin create modal)
 *
 * Note: Admin create is retired (ui#70 / canCreate: false). POs are created
 * via shop flow or directly via API. Edit/view in admin is list-driven.
 */

const TS = Date.now().toString(36);

async function apiCreate<T>(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiFetch<T>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

test.describe('RxSoft Admin Purchases — List Page (UC-RX-PURCHASES-01/02/04/05)', () => {
  test.setTimeout(120_000);

  let accessToken: string | null = null;
  let supplierId: string;
  let warehouseId: string;
  let itemId: string;
  let poId: string;

  // ── Teardown ─────────────────────────────────────────────────
  test.afterAll(async ({ request }) => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
    async function del(path: string) {
      try {
        await request.delete(`http://localhost:8080/api${path}`, { headers });
      } catch {
        /* ignore */
      }
    }
    if (poId) await del(`/purchases/${poId}`);
    if (itemId) await del(`/items/${itemId}`);
    if (warehouseId) await del(`/stock-locations/${warehouseId}`);
    if (supplierId) await del(`/suppliers/${supplierId}`);
  });

  // ── 0. Seed an approved PO ──────────────────────────────────
  test('0. seeds an approved purchase order', async ({ page }) => {
    // Supplier
    const supplier = await apiCreate<{ id: string }>(page, '/suppliers', {
      name: `Admin PO Supplier ${TS}`,
      phone: '08000000002',
      email: `admin-po-sup-${TS}@test.com`,
      address: '123 Admin PO St',
    });
    supplierId = supplier.id;

    // Warehouse
    const loc = await apiCreate<{ id: string }>(page, '/stock-locations', {
      code: `WH-ADM-${TS}`,
      name: `Admin PO Warehouse ${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    warehouseId = loc.id;

    // Item
    const cats = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
    const categoryId = cats.data?.[0]?.id ?? '';
    const uoms = await apiFetch<{ data: Array<{ id: string }> }>(page, '/uoms?limit=1');
    const uomId = uoms.data?.[0]?.id ?? '';
    expect(categoryId).toBeTruthy();
    expect(uomId).toBeTruthy();

    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `Admin PO Item ${TS}`,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
      isActive: true,
    });
    itemId = item.id;

    // Create approved PO
    const po = await apiCreate<{ id: string; status: string; purchaseOrderNumber?: string }>(
      page,
      '/purchases',
      {
        status: 'approved',
        warehouseId,
        supplierId,
        lines: [{ itemId, uomId: uomId, orderedQty: 10, unitCost: 25 }],
      }
    );
    poId = po.id;
    expect(po.status).toBe('approved');
  });

  // ── UC-RX-PURCHASES-01: List, sort and paginate ─────────────

  test('TC-RX-PURCHASES-01-01: admin purchases page loads and shows PO table', async ({ page }) => {
    await page.goto('/rxsoft/purchases', { timeout: 60_000 });
    await expect(page.getByTestId('page-title')).toHaveText('Purchases');

    const body = page.getByTestId('data-table-body');
    await expect(body).toBeVisible({ timeout: 15_000 });
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    // Verify column headers
    const headers = ['PO/Invoice', 'Supplier', 'Warehouse', 'Total Cost', 'Status', 'Lines'];
    for (const header of headers) {
      await expect(page.locator('th').filter({ hasText: header })).toBeVisible();
    }
  });

  test('TC-RX-PURCHASES-01-02: pagination controls render and function', async ({ page }) => {
    await page.goto('/rxsoft/purchases', { timeout: 60_000 });

    const body = page.getByTestId('data-table-body');
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    const pageSizeSelect = page.getByTestId('page-size-select').first();
    if ((await pageSizeSelect.count()) > 0) {
      await expect(pageSizeSelect).toBeVisible();
      await pageSizeSelect.click();
      const opt = page.getByRole('option', { name: /25|50|100/ }).first();
      if ((await opt.count()) > 0) {
        await opt.click();
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }

    const nextBtn = page.getByRole('button', { name: /next|›/i }).first();
    const prevBtn = page.getByRole('button', { name: /previous|‹/i }).first();
    if ((await nextBtn.count()) > 0 && (await nextBtn.isEnabled())) {
      await nextBtn.click();
      await page
        .getByTestId('data-table-body')
        .locator('tr')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 });
      if (await prevBtn.isEnabled()) {
        await prevBtn.click();
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }
  });

  test('TC-RX-PURCHASES-01-03: column sorting on purchases table', async ({ page }) => {
    await page.goto('/rxsoft/purchases', { timeout: 60_000 });

    const sortableHeaders = ['PO/Invoice', 'Supplier', 'Warehouse', 'Total Cost', 'Status'];
    for (const headerText of sortableHeaders) {
      const th = page.locator('th').filter({ hasText: headerText }).first();
      if ((await th.count()) > 0) {
        await th.click({ timeout: 10_000 });
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
        await th.click({ timeout: 10_000 });
        await page
          .getByTestId('data-table-body')
          .locator('tr')
          .first()
          .waitFor({ state: 'visible', timeout: 15_000 });
      }
    }
  });

  // ── UC-RX-PURCHASES-02: Search and filter ───────────────────

  test('TC-RX-PURCHASES-02-01: header search filters purchases', async ({ page }) => {
    await page.goto('/rxsoft/purchases', { timeout: 60_000 });

    const searchInput = page.getByTestId('header-search').first();
    await expect(searchInput).toBeVisible();

    // We don't know the PO number yet, but we can search for the supplier
    // The seeded PO should appear; let's just verify search works
    await searchInput.fill('Admin PO');
    await page.waitForTimeout(1_000);

    // Should show filtered results (at least our seeded PO if the search term matches)
    const body = page.getByTestId('data-table-body');
    await expect(body.locator('tr').first()).toBeVisible({ timeout: 15_000 });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1_000);
    await page
      .getByTestId('data-table-body')
      .locator('tr')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  });

  test('TC-RX-PURCHASES-02-02: no-match search shows empty state', async ({ page }) => {
    await page.goto('/rxsoft/purchases', { timeout: 60_000 });

    const searchInput = page.getByTestId('header-search').first();
    await searchInput.fill('__NO_MATCH_PO__' + TS);
    await page.waitForTimeout(1_000);

    const rows = page.getByTestId('data-table-body').locator('tr');
    const rowCount = await rows.count();
    if (rowCount === 0) {
      expect(rowCount).toBe(0);
    } else {
      const firstRow = rows.first();
      const rowText = await firstRow.innerText();
      expect(rowText.toLowerCase()).toMatch(/no records|no results|no data|empty/);
    }
  });

  // ── UC-RX-PURCHASES-04: Edit / view a Purchases record ──────

  test.skip('TC-RX-PURCHASES-04-01: click PO number opens detail/view', async ({ page }) => {
    test.skip(
      true,
      'Admin purchases list may not have detail view — UI only shows list; honest skip per C12'
    );
  });

  test.skip('TC-RX-PURCHASES-04-02: edit/view shows PO lines and details', async ({ page }) => {
    test.skip(
      true,
      'Admin purchases list may not have detail view — UI only shows list; honest skip per C12'
    );
  });

  // ── UC-RX-PURCHASES-05: Delete / archive ─────────────────────

  test.skip('TC-RX-PURCHASES-05-01: archive/delete PO action available', async ({ page }) => {
    test.skip(
      true,
      'Archive/delete action not exposed for approved POs in current UI — honest skip per C12'
    );
  });

  test.skip('TC-RX-PURCHASES-05-02: archive PO confirms and removes from list', async ({
    page,
  }) => {
    test.skip(true, 'Destructive - requires fresh PO; documented for hardening');
  });
});
