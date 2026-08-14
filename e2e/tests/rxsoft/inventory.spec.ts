import { expect, test } from '../../fixtures/test';

test.describe('RxSoft inventory', () => {
  test('inventory page renders stock sections', async ({ page }) => {
    await page.goto('/rxsoft/inventory');

    await expect(page.getByRole('heading', { name: 'Inventory', level: 2 })).toBeVisible();

    // Section headings (in order of appearance on the page). Substring text
    // ("Stock balances, movement…" card copy) collides, so match exactly.
    await expect(page.getByText('Stock Balances', { exact: true })).toBeVisible();
    await expect(page.getByText('Stock Movements', { exact: true })).toBeVisible();
    await expect(page.getByText('New Stock Adjustment', { exact: true })).toBeVisible();

    // The movements card carries its own Export action.
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });
});