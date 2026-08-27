import { expect, test } from '../../fixtures/test';

test.describe('RxSoft settings', () => {
  test('settings page renders the key/value table', async ({ page }) => {
    await page.goto('/rxsoft/settings');

    await expect(page.getByTestId('page-title')).toHaveText('Settings');
    await expect(page.getByTestId('header-search')).toBeVisible();
    // Mantine Table.Th omits `scope`, so query header cells by text, not role.
    // The page renders multiple key/value tables, so scope to the first.
    await expect(page.locator('th').filter({ hasText: 'Key' }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Value' }).first()).toBeVisible();
  });
});