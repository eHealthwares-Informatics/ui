import { expect, test } from '../../fixtures/test';

test.describe('RxSoft sales', () => {
  test('sales list renders with its table columns', async ({ page }) => {
    await page.goto('/rxsoft/sales');

    await expect(page.getByTestId('page-title')).toHaveText('Sales');
    await expect(page.getByTestId('header-search')).toBeVisible();

    // Mantine Table.Th has no `scope`, so browsers omit the `columnheader`
    // ARIA role — assert the header cell text directly instead.
    for (const header of ['Sale #', 'Channel', 'Store', 'Total', 'Status', 'Date']) {
      await expect(page.locator('th').filter({ hasText: header })).toBeVisible();
    }
  });
});