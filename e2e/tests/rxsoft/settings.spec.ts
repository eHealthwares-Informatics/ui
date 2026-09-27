import { expect, test } from '../../fixtures/test';

test.describe('RxSoft settings', () => {
  test('settings page renders the key/value table', async ({ page }) => {
    await page.goto('/rxsoft/settings');

    // The Settings layout renders its Outlet twice (desktop + mobile
    // breakpoints), so two page titles / search inputs mount — use .first().
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: /^\s*Settings\s*$/ })
        .first()
    ).toHaveText('Settings');
    await expect(page.getByTestId('header-search').first()).toBeVisible();
    // Mantine Table.Th omits `scope`, so query header cells by text, not role.
    // The page renders multiple key/value tables, so scope to the first.
    await expect(page.locator('th').filter({ hasText: 'Key' }).first()).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Value' }).first()).toBeVisible();
  });
});
