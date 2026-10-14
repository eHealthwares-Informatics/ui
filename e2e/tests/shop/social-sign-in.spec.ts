/**
 * Real-credential social sign-in for the Damorex storefront (shop/auth panel).
 *
 * Drives the LIVE Google / Facebook popups end-to-end: click the button in the
 * auth panel, complete the provider dialog with the test identity from the
 * git-ignored e2e/.env.credentials, and assert the storefront session is
 * established (link-by-verified-email OR first-time auto-register — both are
 * valid outcomes; the backend picks based on whether the email is known).
 *
 * Feature-gated: without e2e/.env.credentials these specs SKIP with an
 * explicit message rather than failing the suite (documented in e2e/README).
 */
import { expect, test } from '../../fixtures/test';
import { socialCredentials, socialSkipMessage } from '../../utils/social-credentials';
import { completeFacebookPopup, completeGooglePopup, socialPopup } from '../../utils/social-popup';

const creds = socialCredentials();

// Real-provider flows: Google serves a 403/CORS wall to headless browsers, so
// these specs MUST run headed (headless:false). Windows flash on the runner —
// that is the live provider driving its own chooser/dialog.
test.use({ headless: false });

test.describe('Storefront social sign-in (real credentials)', () => {
  test.skip(!creds, socialSkipMessage());

  test('Google popup signs in / registers', async ({ page, context }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    // Preload the social-auth module so the click handler keeps the user
    // activation (async-import-in-handler would get the popup blocked).
    await page
      .evaluate(() => import('/src/lib/social-auth.ts').catch(() => undefined))
      .catch(() => undefined);

    // Open the auth panel.
    const authTrigger = page.getByRole('button', { name: /sign in|account|login/i }).first();
    await authTrigger.click();

    const popupPromise = socialPopup(context);
    const googleBtn = page.getByRole('button', { name: /^google|continue with google/i }).first();
    await expect(googleBtn).toBeVisible({ timeout: 15_000 });
    await googleBtn.click();

    const popup = await popupPromise;
    await completeGooglePopup(popup, creds!.google);

    // The storefront must end up signed in: the auth panel swaps to the
    // account menu and localStorage holds the token pair.
    await expect
      .poll(async () => page.evaluate(() => Object.keys(window.localStorage ?? {}).join(',')))
      .toContain('token', { timeout: 30_000 });

    if (!popup.isClosed()) await popup.close();
  });

  test('Facebook popup signs in / registers', async ({ page, context }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    const authTrigger = page.getByRole('button', { name: /sign in|account|login/i }).first();
    await authTrigger.click();

    const popupPromise = socialPopup(context);
    const fbBtn = page.getByRole('button', { name: /^facebook|continue with facebook/i }).first();
    await expect(fbBtn).toBeVisible({ timeout: 15_000 });
    await fbBtn.click();

    const popup = await popupPromise;
    await completeFacebookPopup(popup, creds!.facebook);

    await expect
      .poll(async () => page.evaluate(() => Object.keys(window.localStorage ?? {}).join(',')))
      .toContain('token', { timeout: 30_000 });

    if (!popup.isClosed()) await popup.close();
  });
});
