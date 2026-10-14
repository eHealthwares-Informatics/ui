/**
 * Real-credential social sign-in for the console sign-in form
 * (features/auth/sign-in user-auth-form and features/rxsoft sign-in page).
 *
 * Both forms open the live provider popup via @/lib/social-auth and exchange
 * the token at the identity service /auth/oauth/{google,facebook} with
 * channel='console'. The backend links any existing account (any role) by the
 * provider-verified email or auto-registers a first-time identity — the spec
 * accepts either outcome and asserts an established console session.
 *
 * Feature-gated: without e2e/.env.credentials these specs SKIP explicitly.
 */
import { expect, test } from '../../fixtures/test';
import { socialCredentials, socialSkipMessage } from '../../utils/social-credentials';
import { completeFacebookPopup, completeGooglePopup, socialPopup } from '../../utils/social-popup';

const creds = socialCredentials();

// Real-provider flows: Google serves a 403/CORS wall to headless browsers, so
// these specs MUST run headed (headless:false) on the local runner.
test.use({ headless: false });

test.describe('Console social sign-in (real credentials)', () => {
  test.skip(!creds, socialSkipMessage());

  test('console Google button signs in / registers', async ({ page, context }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');

    // Preload the social-auth module so the click handler stays synchronous
    // (an async import executed inside the handler would drop the user
    // activation and Chrome would block the OAuth popup).
    await page
      .evaluate(() => import('/src/lib/social-auth.ts').catch(() => undefined))
      .catch(() => undefined);

    const googleBtn = page.getByRole('button', { name: /google/i }).first();
    await expect(googleBtn).toBeVisible({ timeout: 15_000 });

    const popupPromise = socialPopup(context);
    await googleBtn.click();

    const popup = await popupPromise;
    await completeGooglePopup(popup, creds!.google);

    // The console must end up with a persisted session: the auth store keeps
    // the token pair in localStorage (rxsoft-admin-auth).
    await expect
      .poll(async () => page.evaluate(() => Object.keys(window.localStorage ?? {}).join(',')))
      .toContain('rxsoft-admin-auth', { timeout: 30_000 });

    if (!popup.isClosed()) await popup.close();
  });

  test('console Facebook button signs in / registers', async ({ page, context }) => {
    // The console Facebook button lives on the wave-style sign-in form.
    await page.goto('/sign-in-2');
    await page.waitForLoadState('networkidle');

    const fbBtn = page.getByRole('button', { name: /facebook/i }).first();
    await expect(fbBtn).toBeVisible({ timeout: 15_000 });

    const popupPromise = socialPopup(context);
    await fbBtn.click();

    const popup = await popupPromise;
    await completeFacebookPopup(popup, creds!.facebook);

    await expect
      .poll(async () => page.evaluate(() => Object.keys(window.localStorage ?? {}).join(',')))
      .toContain('rxsoft-admin-auth', { timeout: 30_000 });

    if (!popup.isClosed()) await popup.close();
  });
});
