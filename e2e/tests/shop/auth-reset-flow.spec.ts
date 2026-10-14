import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * Website auth — forgot/verify-email paths (ui#61 ask 1; backend rxsoft#34
 * website auth batch). The reset-password form/mismatch paths are already
 * covered by tests/auth/reset-password.spec.ts (TC-RX-RESET-PASSWORD-01/02,
 * green 2026-10-14) — this spec adds the surrounding flows:
 *
 *  - /shop/forgot-password  "Reset Password" form: Email input
 *    ("you@example.com"), "Send Reset Link" (disabled until an email is
 *    typed), success state "Check Your Email" + "Back to Sign In"
 *  - /shop/verify-email     auto-verifies ?token= on mount; states:
 *    "Email Verified" / "Verification Failed" (+ "…missing its token."
 *    when the link has no token)
 */

test.describe('Website auth — forgot / verify email (ui#61)', () => {
  test('forgot-password form renders and gates submit on an email', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/shop/forgot-password');

    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel('Email')).toBeVisible();

    // Submit stays disabled until an email is typed (verified in source).
    const submit = page.getByRole('button', { name: 'Send Reset Link' });
    await expect(submit).toBeDisabled();
  });

  test('forgot-password: submitting an email reaches the confirmation state', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/shop/forgot-password');

    await page.getByLabel('Email').fill(`ui61-qa-${Date.now().toString(36)}@example.com`);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    // Happy path: the sent-state renders. (The endpoint exists on the
    // website-auth backend — rxsoft#34 batch; if it 4xx'd the page would
    // show a red error instead, which this assertion would catch.)
    await expect(page.getByRole('heading', { name: 'Check Your Email' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: 'Back to Sign In' })).toBeVisible();
  });

  test('verify-email: a link without a token fails with the missing-token message', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/shop/verify-email');

    await expect(page.getByText('Verification Failed')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('This verification link is missing its token.')).toBeVisible();
  });

  test('verify-email: a bad token fails verification (no crash)', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/shop/verify-email?token=e2e-bad-token-2026');

    // The auto-verify call fails server-side → the error state renders with
    // the API message; the page must not crash and offers the way back.
    await expect(page.getByText('Verification Failed')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
  });
});
