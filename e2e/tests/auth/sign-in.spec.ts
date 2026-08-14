import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { adminCredentials } from '../../fixtures/data';

test.describe('sign-in page', () => {
  test('renders username, password and submit fields', async ({ page, signInPage }) => {
    await signInPage.goto();

    await expect(signInPage.usernameInput).toBeVisible();
    await expect(signInPage.passwordInput).toBeVisible();
    await expect(signInPage.submitButton).toBeVisible();
    // App shell title is static (index.html); not page-specific.
    await expect(page).toHaveTitle(/Welcome/);
  });

  test('shows validation errors when submitting empty form', async ({ page, signInPage }) => {
    await signInPage.goto();

    // The form ships defaultValues (admin/test), so clear both fields to
    // exercise the zod "required" validation instead of a real login.
    await signInPage.usernameInput.fill('');
    await signInPage.passwordInput.fill('');

    await signInPage.submit();

    await expect(page.getByText('Please enter your username')).toBeVisible();
    await expect(page.getByText('Please enter your password')).toBeVisible();
  });

  test('rejects invalid credentials with an auth error', async ({ page, signInPage }) => {
    await signInPage.goto();

    await signInPage.signIn('admin', 'wrong-password');

    await signInPage.expectError(/Invalid credentials|Incorrect/);
  });

  test('valid credentials redirect off /sign-in', async ({ page, signInPage }, testInfo) => {
    skipIfBackendDown(testInfo, 'rxsoft');
    await signInPage.goto();

    await signInPage.signIn(adminCredentials.username, adminCredentials.password);

    await signInPage.expectSuccessRedirect();
  });

  test('honours the redirect query parameter', async ({ page, signInPage }, testInfo) => {
    skipIfBackendDown(testInfo, 'rxsoft');
    await signInPage.goto('/apm');

    await signInPage.signIn(adminCredentials.username, adminCredentials.password);

    await expect(page).toHaveURL(/\/apm$/);
  });
});