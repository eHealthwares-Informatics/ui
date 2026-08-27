import { expect, test } from '../../fixtures/test';

/**
 * Damorex Purchasing (PO builder) smoke + validation. A full PO create→receive
 * flow needs seeded suppliers/warehouses and is covered separately; here we
 * verify the builder renders and enforces its required-field validation.
 */
test.describe('Damorex purchases', () => {
  test('renders the PO builder with lines table and actions', async ({ page }) => {
    await page.goto('/damorex/purchases');

    await expect(page.getByRole('button', { name: 'New', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    const linesTable = page.locator('table').filter({ hasText: 'Ordered Qty' });
    await expect(linesTable).toBeVisible();
    for (const header of ['Item', 'UOM', 'Ordered Qty', 'Unit Cost']) {
      await expect(page.locator('th').filter({ hasText: header }).first()).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Add Line' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save as Draft' })).toBeVisible();
  });

  test('blocks saving a draft until a supplier is selected', async ({ page }) => {
    await page.goto('/damorex/purchases');

    // Empty PO tab: no supplier/warehouse yet. Saving must surface validation.
    await page.getByRole('button', { name: 'Save as Draft' }).click();

    await expect(page.getByText('Please select a supplier')).toBeVisible({ timeout: 8_000 });
  });
});