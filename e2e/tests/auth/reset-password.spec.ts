import { expect, test } from '../../fixtures/test';

/**
 * Shop reset-password page — #318 / UC-RX-RESET-PASSWORD-01
 * (ehealthwares/rxsoft#318). Route: /shop/reset-password (public; the token
 * arrives via ?token= from the email link — a dummy token is fine because
 * these TCs never submit).
 *
 * Covers:
 *   TC-RX-RESET-PASSWORD-01  Form renders
 *   TC-RX-RESET-PASSWORD-02  Mismatch validation ("Passwords do not match")
 *
 * Verified against features/shop/auth/reset-password.tsx:
 *  - "Choose a New Password" title; Input.Wrapper labels "New password" /
 *    "Confirm password" (real <label for> bindings).
 *  - Client-side validation: tooShort → "At least 8 characters";
 *    mismatch → "Passwords do not match" (no request is fired).
 */

test.describe('Shop reset-password', () => {
  test('TC-RX-RESET-PASSWORD-01: reset-password form renders', async ({ page }) => {
    await page.goto('/shop/reset-password?token=e2e-dummy-token');

    await expect(page.getByRole('heading', { name: 'Choose a New Password' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByLabel('New password')).toBeVisible();
    await expect(page.getByLabel('Confirm password')).toBeVisible();
  });

  test('TC-RX-RESET-PASSWORD-02: mismatched confirm password shows the validation error', async ({
    page,
  }) => {
    await page.goto('/shop/reset-password?token=e2e-dummy-token');

    const newPassword = page.getByLabel('New password');
    const confirmPassword = page.getByLabel('Confirm password');
    await newPassword.fill('Password123!');
    // Same length, different password → only the mismatch branch fires
    // (not the tooShort branch).
    await confirmPassword.fill('Password456!');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
    // The too-short error must NOT co-appear for a valid-length password.
    await expect(page.getByText('At least 8 characters')).toHaveCount(0);
  });
});
