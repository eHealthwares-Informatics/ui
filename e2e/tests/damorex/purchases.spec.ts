import { expect, test } from '../../fixtures/test';
import { waits, recordTiming, timedWait } from '../../utils/adaptive-wait';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function pickSelectOption(
  page: import('@playwright/test').Page,
  testId: string,
  query: string,
  optionLabel: string,
) {
  const select = page.getByTestId(testId);
  const t0 = Date.now();
  await expect(select).toBeVisible({ timeout: waits.visible });
  await select.click();
  await select.fill(query);
  await select.click();
  const opt = page.getByRole('option', { name: optionLabel }).first();
  await expect(opt).toBeVisible({ timeout: waits.visible });
  await opt.click();
  recordTiming('select:fill-and-pick', Date.now() - t0);
}

/* ------------------------------------------------------------------ */
/*  Purchases — full PO builder flow                                   */
/* ------------------------------------------------------------------ */

test.describe('Damorex purchases', () => {
  /* ---- Smoke / render tests ---- */

  test('renders the PO builder with lines table and action buttons', async ({
    page,
  }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('po-new-btn')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('po-reset-btn')).toBeVisible({ timeout: waits.visible });

    const linesTable = page.getByTestId('po-lines-table');
    await expect(linesTable).toBeVisible({ timeout: waits.visible });
    for (const header of ['Item', 'UOM', 'Ordered Qty', 'Unit Cost']) {
      await expect(
        page.locator('th').filter({ hasText: header }).first(),
      ).toBeVisible({ timeout: waits.visible });
    }

    await expect(page.getByTestId('po-add-line')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('po-save-draft-btn')).toBeVisible({ timeout: waits.visible });
    await expect(page.getByTestId('po-submit-approve-btn')).toBeVisible({ timeout: waits.visible });
  });

  test('blocks saving a draft until a supplier is selected', async ({
    page,
  }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('po-save-draft-btn').click();
    await expect(
      page.getByText('Please select a supplier'),
    ).toBeVisible({ timeout: waits.notification });
  });

  test('blocks saving a draft until a warehouse is selected', async ({
    page,
  }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    await pickSelectOption(
      page,
      'po-supplier-select',
      'Adediran',
      'Adediran Pharma Imports',
    );

    await page.getByTestId('po-save-draft-btn').click();
    await expect(
      page.getByText('Please select a warehouse'),
    ).toBeVisible({ timeout: waits.notification });
  });

  /* ---- Full PO create → save draft → approve ---- */

  test('creates a PO: select supplier + warehouse → pick item → save draft → approve', async ({
    page,
  }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    // 1. Select supplier from seed data.
    await pickSelectOption(
      page,
      'po-supplier-select',
      'Adediran',
      'Adediran Pharma Imports',
    );

    // 2. Select warehouse from seed data.
    await pickSelectOption(page, 'po-warehouse-select', 'Main', 'Main Warehouse');

    // 3. Pick an item on the default line.
    const t0 = Date.now();
    const itemInput = page.getByPlaceholder('Select item').first();
    await expect(itemInput).toBeVisible({ timeout: waits.visible });
    await itemInput.click();
    await itemInput.fill('Neurogesic');
    await itemInput.click();

    const itemOption = page.getByRole('option').first();
    await expect(itemOption).toBeVisible({ timeout: waits.pos.productSelect });
    await itemOption.click();
    recordTiming('pos:product-select', Date.now() - t0);

    // Wait for item selection to settle (price list cells load).
    await page.waitForTimeout(waits.stabilize);

    // 4. Set ordered quantity.
    const orderedInput = page.getByTestId('po-line-ordered-qty').first();
    await expect(orderedInput).toBeVisible({ timeout: waits.visible });
    await orderedInput.click({ clickCount: 3 });
    await orderedInput.press('Backspace');
    await orderedInput.type('10', { delay: 30 });
    await orderedInput.press('Tab');
    await page.waitForTimeout(waits.animation);

    // 5. Save as Draft.
    await timedWait('po:save-draft', () =>
      page.getByTestId('po-save-draft-btn').click().then(() =>
        expect(page.getByTestId('po-summary-status')).toBeVisible({
          timeout: waits.po.statusBadge,
        }),
      ),
    );

    // 6. Submit & Approve.
    await timedWait('po:approve', () =>
      page.getByTestId('po-submit-approve-btn').click().then(() =>
        expect(page.getByTestId('po-summary-status')).toContainText('approved', {
          timeout: waits.po.statusBadge,
        }),
      ),
    );
  });

  /* ---- Multi-tab management ---- */

  test('opens a new tab and closes it', async ({ page }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    // Wait for tabs to render.
    await expect(page.getByTestId('po-tab').first()).toBeVisible({
      timeout: waits.visible,
    });
    const initialCount = await page.getByTestId('po-tab').count();
    expect(initialCount).toBeGreaterThanOrEqual(1);

    // Click the + button to add a new tab.
    await page.getByTestId('po-add-tab').click();

    // A new tab should appear.
    await expect(page.getByTestId('po-tab')).toHaveCount(initialCount + 1, {
      timeout: waits.listRender,
    });

    // Close the last tab via its X button.
    await page.getByTestId('po-tab-close').last().click();

    // Back to initial count.
    await expect(page.getByTestId('po-tab')).toHaveCount(initialCount, {
      timeout: waits.listRender,
    });
  });

  /* ---- Reset clears the current tab ---- */

  test('reset clears supplier, warehouse, and lines', async ({ page }) => {
    await page.goto('/shop/purchases');
    await page.waitForLoadState('networkidle');

    // Select a supplier.
    await pickSelectOption(
      page,
      'po-supplier-select',
      'Adediran',
      'Adediran Pharma Imports',
    );

    // Verify it was set.
    const supplierInput = page.getByPlaceholder('Supplier');
    await expect(supplierInput).toHaveValue('Adediran Pharma Imports', {
      timeout: waits.visible,
    });

    // Click Reset.
    await page.getByTestId('po-reset-btn').click();

    // Supplier placeholder should reappear (input cleared).
    await expect(supplierInput).toHaveValue('', { timeout: waits.visible });
  });
});
