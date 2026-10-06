import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft inventory — stock transfer between locations (Phase 3 operations).
 *
 * Covers UC-RX-INVENTORY-TRANSFER-01 (ehealthwares/rxsoft#91):
 *   TC-RX-INVENTORY-TRANSFER-01 — transfer modal opens (from/to + qty)
 *   TC-RX-INVENTORY-TRANSFER-02 — quantity over available blocks submit
 *   TC-RX-INVENTORY-TRANSFER-03 — transfer succeeds (toast + server state)
 *
 * Self-setup: fresh orgs have stock locations (HQ + STORE) but no balances.
 * Each test creates its OWN item and seeds a balance (qty 5) at location A.
 *
 * Selectors are testid-first per the e2e convention (AGENTS.md rule 1).
 */
const TS = Date.now().toString(36);

type BalanceSetup = {
  itemId: string;
  locationId: string;
  otherLocationId: string;
  itemName: string;
};

/**
 * Mantine 9 controls put data-testid on the wrapper in some versions and on
 * the input in others — try the nested input first, fall back to the testid
 * element itself.
 */
async function interact(
  control: import('@playwright/test').Locator,
  action: 'click' | 'fill',
  value?: string
): Promise<void> {
  const input = control.locator('input');
  if ((await input.count()) > 0) {
    if (action === 'click') await input.click();
    else await input.fill(value!);
  } else if (action === 'click') {
    await control.click();
  } else {
    await control.fill(value!);
  }
}

/** Creates a dedicated item + balance qty 5 at the first location; second location as transfer dest. */
async function ensureBalance(page: import('@playwright/test').Page): Promise<BalanceSetup> {
  const categories = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
  const uoms = await apiFetch<{ data: Array<{ id: string }> }>(page, '/uoms?limit=1');
  const locations = await apiFetch<{ data: Array<{ id: string }> }>(
    page,
    '/stock-locations?limit=5'
  );
  const categoryId = categories.data?.[0]?.id;
  const uomId = uoms.data?.[0]?.id;
  const locs = locations.data ?? [];
  expect(categoryId, 'seeded category required').toBeTruthy();
  expect(uomId, 'seeded uom required').toBeTruthy();
  expect(locs.length, 'need >=2 stock locations for a transfer').toBeGreaterThanOrEqual(2);

  const itemName = `E2E Inv Xfer ${TS}-${Math.random().toString(36).slice(2, 6)}`;
  const item = await apiFetch<{ id: string }>(page, '/items', {
    method: 'POST',
    body: JSON.stringify({
      name: itemName,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
    }),
  });
  await apiFetch(page, '/inventory/adjust-quantity', {
    method: 'POST',
    body: JSON.stringify({
      itemId: item.id,
      locationId: locs[0].id,
      deltaQuantity: 5,
      reason: `E2E seed stock ${TS}`,
    }),
  });
  return { itemId: item.id, locationId: locs[0].id, otherLocationId: locs[1].id, itemName };
}

/** Opens the transfer modal for the test's balance row. */
async function openTransferModal(
  page: import('@playwright/test').Page,
  itemName: string
): Promise<import('@playwright/test').Locator> {
  await page.goto('/rxsoft/inventory', { timeout: 60_000 });
  // Filter the 39k-row balances table to our item (seeded orgs carry
  // full-catalog stock); row render is async — allow up to 30s.
  await page.getByTestId('header-search').first().fill(itemName);
  const onHandHeader = page.locator('th').filter({ hasText: 'On Hand' }).first();
  await expect(onHandHeader).toBeVisible({ timeout: 15_000 });
  const balancesTable = onHandHeader.locator('xpath=ancestor::table[1]');
  const targetRow = balancesTable.locator('tbody tr').filter({ hasText: itemName }).first();
  await expect(targetRow).toBeVisible({ timeout: 30_000 });
  await targetRow.getByTestId('row-transfer').click();
  // Mantine 9 Modal keeps the root testid element hidden while content
  // renders in a portal — target the dialog role (receiving spec pattern).
  const dialog = page.getByRole('dialog', { name: /Transfer Stock/ });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  return dialog;
}

test.describe('RxSoft inventory transfers', () => {
  test('TC-RX-INVENTORY-TRANSFER-01: transfer modal opens with from, item, available, dest', async ({
    page,
  }) => {
    const setup = await ensureBalance(page);
    const dialog = await openTransferModal(page, setup.itemName);

    await expect(dialog).toContainText('From:');
    await expect(dialog).toContainText(setup.itemName);
    await expect(dialog).toContainText('Available:');
    await expect(dialog.getByTestId('transfer-destination')).toBeVisible();
    await expect(dialog.getByTestId('transfer-quantity')).toBeVisible();
    // Submit gated until destination + quantity are set.
    await expect(dialog.getByTestId('transfer-submit')).toBeDisabled();
  });

  test('TC-RX-INVENTORY-TRANSFER-02: quantity over available blocks submit', async ({ page }) => {
    const setup = await ensureBalance(page);
    const dialog = await openTransferModal(page, setup.itemName);

    // Destination required before the over-available gate can be exercised.
    const destSelect = dialog.getByTestId('transfer-destination');
    await interact(destSelect, 'click');
    const destOption = page
      .getByRole('option')
      .filter({ hasText: /STORE|HQ|E2E/i })
      .first();
    await expect(destOption.or(page.getByRole('option').first())).toBeVisible({ timeout: 12_000 });
    await ((await destOption.count()) ? destOption : page.getByRole('option').first()).click();

    const qtyInput = dialog.getByTestId('transfer-quantity');
    // Balance has qty 5 — request far more than available.
    await interact(qtyInput, 'fill', '99999');
    await expect(
      dialog.getByTestId('transfer-submit'),
      'submit disabled when quantity exceeds available'
    ).toBeDisabled();

    // A within-available quantity re-enables (gate is the over-available check).
    await interact(qtyInput, 'fill', '1');
    await expect(dialog.getByTestId('transfer-submit')).toBeEnabled();
  });

  test('TC-RX-INVENTORY-TRANSFER-03: transfers stock to another location', async ({ page }) => {
    const setup = await ensureBalance(page);
    const dialog = await openTransferModal(page, setup.itemName);

    // Destination location (source is excluded from the options).
    const destSelect = dialog.getByTestId('transfer-destination');
    await interact(destSelect, 'click');
    const destOption = page.getByRole('option').first();
    await expect(destOption).toBeVisible({ timeout: 12_000 });
    await destOption.click();

    await interact(dialog.getByTestId('transfer-quantity'), 'fill', '1');
    await dialog.getByTestId('transfer-submit').click();

    await expect(page.getByText('Stock transferred successfully.')).toBeVisible({
      timeout: 15_000,
    });

    // Server-side: balance at the source location decreased.
    const balances = await apiFetch<{
      data: Array<{ itemId: string; locationId: string; quantityOnHand: number }>;
    }>(page, `/inventory/stock-balances?itemId=${setup.itemId}&limit=10`);
    const source = (balances.data ?? []).find((b) => b.locationId === setup.locationId);
    expect(source?.quantityOnHand, 'source balance decreased by 1').toBe(4);
  });
});
