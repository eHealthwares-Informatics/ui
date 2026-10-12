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
 * /rxsoft/settings/{account,appearance,display,notifications}, each a
 * ContentSection with an h3 heading titled Account / Appearance / Display /
 * Notifications (run 4c18: they are NOT RxPages — no page-title testid on
 * the section pages; only the settings index carries it). The settings
 * layout renders its Outlet twice (desktop + mobile breakpoints) — use .first().
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
    // Test-design fix (run 4c18, b2c-bespoke evidence): the section pages
    // render ContentSection (features/settings/components/content-section.tsx
    // — <Title order={3} size="lg">{title}</Title>), NOT RxPage, so the
    // page-title testid never exists here. Assert the section heading.
    // The settings layout renders its Outlet twice (desktop + mobile) — .first().
    await expect(page.getByRole('heading', { name: 'Account' }).first()).toBeVisible();
  });

  test('TC-RX-SETTINGS-03: Appearance section renders', async ({ page }) => {
    await page.goto('/rxsoft/settings/appearance');
    await expect(page.getByRole('heading', { name: 'Appearance' }).first()).toBeVisible();
  });

  test('TC-RX-SETTINGS-04: Display and Notifications sections render', async ({ page }) => {
    await page.goto('/rxsoft/settings/display');
    await expect(page.getByRole('heading', { name: 'Display' }).first()).toBeVisible();

    await page.goto('/rxsoft/settings/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications' }).first()).toBeVisible();
  });
});
