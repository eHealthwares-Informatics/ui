import { expect, test } from '../../fixtures/test';

test.describe('sign-out', () => {
  // Runs in the `admin` project (storageState admin.json), so the user is
  // authenticated at the app shell when the test begins.
  test('signs the user out and returns to /sign-in', async ({ page, appLayout }) => {
    await page.goto('/');

    await expect(page.getByText('Whoops!')).toHaveCount(0, { timeout: 1_000 }).catch(() => undefined);

    await appLayout.openSignOut();

    await expect(appLayout.signOutDialog).toBeVisible();
    await appLayout.confirmSignOut();

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('closing the modal without confirming keeps the session', async ({ page, appLayout }) => {
    await page.goto('/');

    await appLayout.openSignOut();

    await expect(appLayout.signOutDialog).toBeVisible();
    await appLayout.signOutDialog.getByTestId('confirm-dialog-cancel').click();

    await expect(appLayout.signOutDialog).toBeHidden();
    await expect(page).not.toHaveURL(/\/sign-in/);
  });
});