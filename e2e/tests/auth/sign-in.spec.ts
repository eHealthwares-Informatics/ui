import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { adminCredentials } from '../../fixtures/data';

test.describe('sign-in page', () => {
  // Each test performs a full browser login against live identity, so give the
  // file extra headroom (config default is 60s).
  test.setTimeout(120_000);

  // TC-AUTH-01 — Login success: goto /sign-in; fill admin/password; submit →
  // Redirected off /sign-in; app shell visible.
  test('TC-AUTH-01 — renders username, password and submit fields', async ({ page, signInPage }) => {
    await signInPage.goto();

    await expect(signInPage.usernameInput).toBeVisible();
    await expect(signInPage.passwordInput).toBeVisible();
    await expect(signInPage.submitButton).toBeVisible();
    // App shell title is static (index.html); not page-specific.
    await expect(page).toHaveTitle(/Welcome/);
  });

  // TC-AUTH-03 — Empty validation: submit empty form → per-field validation
  // messages. The form ships defaultValues (admin/test), so clear both fields
  // to exercise the zod "required" validation instead of a real login.
  // Mantine's TextInput wraps the raw <input> in extra DOM, so Playwright's
  // fill('') / clear() may not propagate through RHF's register handler.
  // Triple-click selects all text, Backspace deletes it — this fires real
  // keydown/input events that RHF reliably captures.
  test('TC-AUTH-03 — shows validation errors when submitting empty form', async ({ page, signInPage }) => {
    await signInPage.goto();

    // Wait until the form is interactive (React hydration can lag under load).
    await expect(signInPage.submitButton).toBeEnabled();

    await signInPage.usernameInput.click({ clickCount: 3 });
    await signInPage.page.keyboard.press('Backspace');
    await signInPage.passwordInput.click({ clickCount: 3 });
    await signInPage.page.keyboard.press('Backspace');

    await signInPage.submit();

    await expect(page.getByText('Please enter your email or username')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Please enter your password')).toBeVisible({ timeout: 15_000 });
  });

  // TC-AUTH-02 — Wrong credentials: fill admin/wrong; submit → inline error
  // "Invalid credentials" (rendered from the auth store via data-testid
  // `sign-in-error`).
  test('TC-AUTH-02 — rejects invalid credentials with an auth error', async ({ page, signInPage }) => {
    await signInPage.goto();

    await signInPage.signIn('admin', 'wrong-password');

    await signInPage.expectError(/Invalid credentials|Incorrect/);
  });

  // TC-AUTH-01 (success path) — valid credentials redirect off /sign-in.
  test('TC-AUTH-01 — valid credentials redirect off /sign-in', async ({ page, signInPage }, testInfo) => {
    skipIfBackendDown(testInfo);
    await signInPage.goto();

    const creds = adminCredentials();
    await signInPage.signIn(creds.username, creds.password);

    await signInPage.expectSuccessRedirect();
  });

  // TC-AUTH-04 — Redirect preserved: goto /sign-in?redirect=/rxsoft/items;
  // login → URL becomes /rxsoft/items. The sign-in route validates
  // `redirect: z.string().optional()` in its search schema.
  test('TC-AUTH-04 — honours the redirect query parameter', async ({ page, signInPage }, testInfo) => {
    skipIfBackendDown(testInfo);
    await signInPage.goto('/rxsoft/items');

    const creds = adminCredentials();
    await signInPage.signIn(creds.username, creds.password);

    await expect(page).toHaveURL(/\/rxsoft\/items$/);
  });
});
