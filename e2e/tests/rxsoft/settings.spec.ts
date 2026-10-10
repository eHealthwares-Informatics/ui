import { expect, test } from '../../fixtures/test';

/**
 * RxSoft settings — #316 / UC-RX-SETTINGS-01 (ehealthwares/rxsoft#316).
 *
 * Covers:
 *   TC-RX-SETTINGS-01  Settings index (key/value table)
 *   TC-RX-SETTINGS-02  Account section
 *   TC-RX-SETTINGS-03  Appearance section
 *   TC-RX-SETTINGS-04  Display / Notifications sections
 *
 * Section routes verified in routes/_authenticated/rxsoft/settings/*:
 * /rxsoft/settings/{account,appearance,display,notifications}, each an RxPage
 * titled Account / Appearance / Display / Notifications. The settings layout
 * renders its Outlet twice (desktop + mobile breakpoints) — use .first().
 */

test.describe('RxSoft settings', () => {
  test('TC-RX-SETTINGS-01: settings page renders the key/value table', async ({ page }) => {
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

  test('TC-RX-SETTINGS-02: Account section renders', async ({ page }) => {
    await page.goto('/rxsoft/settings/account');
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: /^\s*Account\s*$/ })
        .first()
    ).toHaveText('Account');
  });

  test('TC-RX-SETTINGS-03: Appearance section renders', async ({ page }) => {
    await page.goto('/rxsoft/settings/appearance');
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: /^\s*Appearance\s*$/ })
        .first()
    ).toHaveText('Appearance');
  });

  test('TC-RX-SETTINGS-04: Display and Notifications sections render', async ({ page }) => {
    await page.goto('/rxsoft/settings/display');
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: /^\s*Display\s*$/ })
        .first()
    ).toHaveText('Display');

    await page.goto('/rxsoft/settings/notifications');
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: /^\s*Notifications\s*$/ })
        .first()
    ).toHaveText('Notifications');
  });
});
