import { expect, test } from '../../fixtures/test';

/**
 * TC-AUTH-05..08 — secondary auth pages render and submit (project `public`,
 * no backend required: these forms are client-side validated and either stub
 * the submit locally or navigate without an API call).
 *
 * Selectors verified against source:
 *  - sign-in-2 → UserAuthForm (features/auth/sign-in/components/user-auth-form.tsx):
 *    Mantine TextInput label "Username", PasswordInput label "Password",
 *    submit Button "Sign in"; error path via the shared auth store.
 *  - sign-up → SignUpForm (features/auth/sign-up/components/sign-up-form.tsx):
 *    TextInput label "Email", PasswordInput "Password" / "Confirm Password",
 *    submit Button "Create Account"; zod rules: invalid email message
 *    "Invalid email address", confirm mismatch "Passwords don't match".
 *    Submit is stubbed (setTimeout only) — no API call to assert.
 *  - forgot-password → ForgotPasswordForm (…/forgot-password/components/…):
 *    TextInput label "Email", submit Button "Continue"; on submit shows a
 *    "Sending email..." notification, then navigates to /otp (2s sleep).
 *  - otp → OtpForm (…/otp/components/otp-form.tsx): Mantine PinInput length 6
 *    (type number), submit Button "Verify" — disabled until 6 digits are
 *    entered; submitting shows a "You submitted the following values:"
 *    notification (showSubmittedData) and navigates to '/' after ~1s.
 */
test.describe('secondary auth pages', () => {
  test.describe.configure({ mode: 'serial' });
  // Cold-Vite first goto can be slow; keep generous timeouts.
  test.setTimeout(60_000);

  // TC-AUTH-05 — sign-in-2 renders and validates credentials.
  test('TC-AUTH-05 — sign-in-2 renders and submits the alternate sign-in form', async ({
    page,
  }) => {
    await page.goto('/sign-in-2');

    const username = page.getByLabel('Username');
    const password = page.getByLabel('Password');
    await expect(username).toBeVisible({ timeout: 20_000 });
    await expect(password).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    // Empty submit → per-field validation messages (zod via RHF).
    await username.fill('');
    await password.fill('');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Please enter your username')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Please enter your password')).toBeVisible();

    // Wrong credentials → error text from the shared auth store.
    await username.fill('admin');
    await password.fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('form')).toContainText(/Invalid credentials|Incorrect/);
  });

  // TC-AUTH-06 — sign-up renders, validates, and submits locally (stubbed).
  test('TC-AUTH-06 — sign-up renders, validates and submits', async ({ page }) => {
    await page.goto('/sign-up');

    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password', { exact: true });
    const confirm = page.getByLabel('Confirm Password');
    await expect(email).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Validation: invalid email + password mismatch.
    await email.fill('not-an-email');
    await password.fill('short');
    await confirm.fill('different');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Password must be at least 7 characters long')).toBeVisible();
    await expect(page.getByText("Passwords don't match")).toBeVisible();

    // Valid submit is stubbed client-side (3s loading state, no API call) —
    // assert the button enters its loading state.
    await email.fill('e2e-signup@example.com');
    await password.fill('supersecret7');
    await confirm.fill('supersecret7');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeDisabled();
  });

  // TC-AUTH-07 — forgot-password validates email and navigates to /otp.
  test('TC-AUTH-07 — forgot-password validates email and continues to otp', async ({ page }) => {
    await page.goto('/forgot-password');

    const email = page.getByLabel('Email');
    await expect(email).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();

    // Empty submit → "Please enter your email".
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Please enter your email')).toBeVisible({ timeout: 15_000 });

    // Invalid email format → z.email error.
    await email.fill('not-an-email');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('form')).toContainText(/Invalid|email/i);

    // Valid email → loading notification, then navigation to /otp (2s sleep).
    await email.fill('e2e-reset@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Sending email...')).toBeVisible({ timeout: 15_000 });
    await page.waitForURL(/\/otp$/, { timeout: 20_000 });
  });

  // TC-AUTH-08 — otp validates the 6-digit code and submits.
  test('TC-AUTH-08 — otp validates the 6-digit code and submits', async ({ page }) => {
    await page.goto('/otp');

    await expect(page.getByText('One-Time Password')).toBeVisible({ timeout: 20_000 });
    const verify = page.getByRole('button', { name: 'Verify' });
    await expect(verify).toBeVisible();
    await expect(verify).toBeDisabled(); // disabled until 6 digits entered

    // Partial code keeps Verify disabled and shows the validation error on submit.
    const pin = page.locator('input[inputmode="numeric"]');
    await pin.first().fill('1');
    await expect(verify).toBeDisabled();

    // Full code enables Verify; submit shows the submitted-values notification.
    await pin.first().fill('123456');
    await expect(verify).toBeEnabled();
    await verify.click();
    await expect(page.getByText('You submitted the following values:')).toBeVisible({
      timeout: 15_000,
    });
  });
});
