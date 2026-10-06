import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * RxSoft stock locations — UI create (Phase 3b Ops CRUD).
 *
 * Covers UC-RX-STOCK-LOCATIONS-03 (create a Stock Locations record) per
 * ehealthwares/rxsoft#95. The crud-suite gates this resource off (create
 * modal needs required parentId + warehouseId async-selects) — this spec
 * drives the modal with org-state seeded references.
 */
const TS = Date.now().toString(36);

test.describe('RxSoft stock locations', () => {
  test('TC-RX-STOCK-LOCATIONS-03: creates a location through the create modal', async ({
    page,
  }) => {
    // Parent location name from org-state (seeded main/sale stock location).
    // Warehouse name: org-state entry can be nameless — fall back to the API.
    const org = readOrgState();
    let warehouseName = org?.warehouses?.[0]?.name ?? '';
    if (!warehouseName) {
      const warehouses = await apiFetch<{ data: Array<{ name?: string }> }>(
        page,
        '/warehouses?limit=5'
      );
      warehouseName = (warehouses.data ?? []).map((w) => w.name ?? '').find(Boolean) ?? '';
    }
    const parentName = org?.stockLocations?.main?.name ?? org?.stockLocations?.sale?.name ?? '';
    test.skip(!warehouseName || !parentName, 'no warehouse/parent location available for create');

    await page.goto('/rxsoft/stock-locations', { timeout: 60_000 });
    await expect(page.getByTestId('page-title')).toHaveText('Stock Locations');

    const locationName = `E2E SL ${TS}`;
    const locationCode = `SL-${TS}`;

    await page.getByTestId('header-new').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Code + Name (required)
    await dialog.getByTestId('field-code').fill(locationCode);
    await dialog.getByTestId('field-name').fill(locationName);

    // Parent Location (async-select, required) — pick a seeded location.
    // Filter may match several org locations (Main/Sale/Return share the
    // org prefix) — .first() is fine; any seeded location works as parent.
    const parentSelect = dialog.getByTestId('async-select-parentId');
    await expect(parentSelect).toBeVisible();
    await parentSelect.fill(parentName.slice(0, 24));
    const parentOption = page
      .getByRole('option')
      .filter({ hasText: parentName.slice(0, 24) })
      .first();
    await expect(parentOption).toBeVisible({ timeout: 12_000 });
    await parentOption.click();

    // Warehouse (async-select, required) — pick a seeded warehouse.
    const warehouseSelect = dialog.getByTestId('async-select-warehouseId');
    await expect(warehouseSelect).toBeVisible();
    await warehouseSelect.fill(warehouseName.slice(0, 24));
    const warehouseOption = page
      .getByRole('option')
      .filter({ hasText: warehouseName.slice(0, 24) })
      .first();
    await expect(warehouseOption).toBeVisible({ timeout: 12_000 });
    await warehouseOption.click();

    // Location Type defaults to Internal (select control has no field-<name>
    // testid under Mantine 9 — label visible in the modal; default is valid).
    await expect(dialog.getByText('Location Type')).toBeVisible();

    // Submit via ModalDataForm's create button — capture the POST so a
    // backend rejection surfaces with its body instead of a modal timeout.
    const postRes = page.waitForResponse(
      (res) => res.url().includes('/api/stock-locations') && res.request().method() === 'POST',
      { timeout: 20_000 }
    );
    await dialog.getByTestId('form-create').click();
    const res = await postRes;
    const resBody = await res.text().catch(() => '');
    expect(res.status(), `POST /stock-locations failed: ${resBody.slice(0, 300)}`).toBeLessThan(
      400
    );
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    // Server-side: the location exists.
    const list = await apiFetch<{ data: Array<{ name?: string; code?: string }> }>(
      page,
      `/stock-locations?search=${encodeURIComponent(locationName)}&limit=10`
    );
    const created = (list.data ?? []).find(
      (r) => r.name === locationName || r.code === locationCode
    );
    expect(created, 'created stock location present via API').toBeTruthy();
  });
});
