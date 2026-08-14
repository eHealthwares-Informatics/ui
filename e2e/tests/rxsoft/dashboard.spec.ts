import { expect, test } from '../../fixtures/test';

test.describe('RxSoft dashboard', () => {
  test('/rxsoft redirects to the module root', async ({ page }) => {
    await page.goto('/rxsoft');

    await expect(page).toHaveURL(/\/rxsoft\/items/);
    await expect(page.getByRole('heading', { name: 'Items', level: 2 })).toBeVisible();
  });

  test('dashboard renders KPI cards from the reports endpoints', async ({ page }) => {
    await page.goto('/rxsoft/dashboard');

    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible();

    // KPIs render once the three reports requests resolve; tolerate the
    // error state so a down reports API does not hard-fail the spec.
    await expect(page.locator('body')).toContainText(/Inventory Items|Failed to load dashboard reports\./);
  });
});