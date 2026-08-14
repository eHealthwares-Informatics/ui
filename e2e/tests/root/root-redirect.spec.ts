import { expect, test } from '../../fixtures/test';

test.describe('root redirect', () => {
  // Public project: the browser context has no storage state, so the
  // authenticated-route guard must bounce '/' to /sign-in. When the backend
  // is unreachable the /auth/me bootstrap also falls back to signed-out.
  test('unauthenticated visitors are sent to /sign-in', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('sign-in page receives the original redirect target', async ({ page }) => {
    // /apm is a public website page (no auth guard); use a guarded RXSoft
    // route so the guard rewrites the target into ?redirect=.
    await page.goto('/rxsoft/items');

    await expect(page).toHaveURL(/\/sign-in\?redirect=/);
  });
});