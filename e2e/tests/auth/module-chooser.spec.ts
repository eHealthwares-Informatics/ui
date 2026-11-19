import { adminCredentials } from '../../fixtures/data';
import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * Module chooser + remembered module + cross-tab session.
 *
 * - `/modules` is a pre-module screen: no sidebar / nav toggle until the user
 *   picks a module.
 * - The picked module is persisted; the next login (no ?redirect=) goes
 *   straight to that module instead of the chooser.
 * - A second tab auto-logs in with the shared session even when "Remember me"
 *   is off (the session cookie keeps the token usable for this browser session).
 */

const MODULE_KEY = 'rxsoft_admin_selected_module';
const SESSION_COOKIE = 'rxsoft_admin_session';

async function clearSessionKeepModule(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    const keep = new Set(['rxsoft_admin_selected_module', 'rxsoft_admin_remember_me']);
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith('rxsoft_admin_') && !keep.has(key)) {
        window.localStorage.removeItem(key);
      }
    }
    window.localStorage.removeItem('rxsoft-admin-auth');
    window.sessionStorage.clear();
  });
}

test.describe('module chooser + remembered module', () => {
  test.setTimeout(180_000);

  test('hides the menu on /modules, remembers the picked module and returns to it next login', async ({
    page,
    signInPage,
  }, testInfo) => {
    skipIfBackendDown(testInfo);

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.evaluate((key) => window.localStorage.removeItem(key), MODULE_KEY);

    const creds = adminCredentials();
    await signInPage.signIn(creds.username, creds.password);
    await page.waitForURL(/\/modules$/, { timeout: 60_000 });

    // Pre-module screen: no sidebar, no rail toggle.
    await expect(page.getByTestId('module-landing')).toBeVisible();
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0);
    await expect(page.getByTestId('header-nav-toggle')).toHaveCount(0);

    await page.getByTestId('module-card-rxsoft').click();
    await expect(page).toHaveURL(/\/rxsoft\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), MODULE_KEY))
      .toBe('rxsoft');

    // Log out locally (keep the remembered module) and sign in again with no
    // redirect: the remembered module wins over the chooser.
    await clearSessionKeepModule(page);
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await signInPage.signIn(creds.username, creds.password);
    await expect(page).toHaveURL(/\/rxsoft\/dashboard$/, { timeout: 60_000 });
    await expect(page.getByTestId('app-sidebar')).toBeVisible();
  });

  test('a second tab auto-logs in with a session-only login (Remember me off)', async ({
    page,
    context,
    signInPage,
  }, testInfo) => {
    skipIfBackendDown(testInfo);

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.evaluate((key) => window.localStorage.removeItem(key), MODULE_KEY);

    // Uncheck "Remember me" → tokens are session-scoped for this browser.
    await page.getByTestId('sign-in-remember-me').click();

    const creds = adminCredentials();
    await signInPage.signIn(creds.username, creds.password);
    await page.waitForURL(/\/modules$/, { timeout: 60_000 });

    await page.getByTestId('module-card-rxsoft').click();
    await expect(page).toHaveURL(/\/rxsoft\/dashboard$/, { timeout: 30_000 });

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('rxsoft_admin_remember_me')))
      .toBe('false');
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name === SESSION_COOKIE && cookie.value === '1'),
      'session-only login must set the shared session cookie'
    ).toBe(true);

    // A brand-new tab shares localStorage + the session cookie: opening the app
    // root must restore the session and land on the remembered module.
    const second = await context.newPage();
    await second.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(second).toHaveURL(/\/rxsoft\/dashboard$/, { timeout: 60_000 });
    await expect(second.getByTestId('app-sidebar')).toBeVisible();
    await second.close();
  });
});
