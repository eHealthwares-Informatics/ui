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

  test('verify-email: the failed state resends the verification email (rxsoft-qa#792)', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);

    const resendCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/website/auth/resend-verification'))
        resendCalls.push(request.url());
    });

    // `email` is prefilled from the query param so the user need not retype it.
    await page.goto('/shop/verify-email?token=e2e-bad-token-2026&email=shopper@example.com');
    await expect(page.getByText('Verification Failed')).toBeVisible({ timeout: 30_000 });

    const resend = page.getByTestId('resend-verification');
    await expect(resend).toBeVisible();
    await expect(page.getByTestId('resend-email')).toHaveValue('shopper@example.com');

    await resend.click();

    // The POST actually fires and the user gets a confirmation.
    await expect.poll(() => resendCalls.length, { timeout: 15_000 }).toBeGreaterThan(0);
    await expect(page.getByText(/verification link to shopper@example\.com/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test('verify-email error state: resend control fires the verification POST (ui#792/PR#154)', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Bad-token error state (the resend control ships there per PR #154).
    await page.goto('/shop/verify-email?token=e2e-bad-token-resend');
    await expect(page.getByText('Verification Failed')).toBeVisible({ timeout: 30_000 });

    const resend = page.getByTestId('resend-verification');
    await expect(resend).toBeVisible({ timeout: 15_000 });

    // Empty email → orange toast, no request.
    await resend.click();
    await expect(page.getByText('Enter your email address to resend.')).toBeVisible({
      timeout: 10_000,
    });

    // With an email → POST /website/auth/resend-verification fires.
    await page.getByLabel('Email').fill(`ui792-${Date.now().toString(36)}@example.com`);
    const post = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/website/auth/resend-verification'),
      { timeout: 20_000 }
    );
    await resend.click();
    expect((await post).status(), 'resend endpoint must respond').toBeLessThan(500);
  });
});
