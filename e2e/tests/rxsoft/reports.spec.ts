import { expect, test } from '../../fixtures/test';

test.describe('RxSoft financial reports', () => {
  test('trial balance renders', async ({ page }) => {
    await page.goto('/rxsoft/reports/trial-balance');

    await expect(page.getByTestId('page-title')).toHaveText('Trial Balance');
    await expect(page.getByText('As of date')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
  });

  test('balance sheet renders', async ({ page }) => {
    await page.goto('/rxsoft/reports/balance-sheet');

    await expect(page.getByTestId('page-title')).toHaveText('Balance Sheet');
    await expect(page.getByText('As of date')).toBeVisible();
  });

  test('income statement renders', async ({ page }) => {
    await page.goto('/rxsoft/reports/income-statement');

    await expect(page.getByTestId('page-title')).toHaveText('Income Statement');
    // DatePickerInput labels; exact match avoids "Customers" (substring 'to').
    await expect(page.getByText('From', { exact: true })).toBeVisible();
    await expect(page.getByText('To', { exact: true })).toBeVisible();
  });
});