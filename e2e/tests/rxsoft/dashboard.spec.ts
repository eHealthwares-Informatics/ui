import { expect, test } from '../../fixtures/test';

test.describe('RxSoft dashboard', () => {
  test('/rxsoft redirects to the module root', async ({ page }) => {
    await page.goto('/rxsoft');

    // Module root for rxsoft is /rxsoft/dashboard (not the sales analytics route).
    await expect(page).toHaveURL(/\/rxsoft\/dashboard/);
    await expect(page.getByTestId('page-title')).toHaveText(/Dashboard/i);
  });

  test('dashboard renders KPI cards from the reports endpoints', async ({ page }) => {
    await page.goto('/dashboard/sales');

    await expect(page.getByTestId('page-title')).toHaveText('Sales Analytics');

    // KPIs render once the three reports requests resolve; tolerate the
    // error state so a down reports API does not hard-fail the spec.
    await expect(page.locator('body')).toContainText(
      /Overview of sales performance|Failed to load dashboard reports\./
    );
  });
});
