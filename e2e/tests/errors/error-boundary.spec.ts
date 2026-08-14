import { expect, test } from '../../fixtures/test';
import { generalErrorBody, generalErrorH1, notFoundH1 } from '../../utils/selectors';

test.describe('error boundary', () => {
  test('500 route renders the GeneralError surface', async ({ page }) => {
    // (errors)/500 registers `component: GeneralError` on the router.
    await page.goto('/500');

    await expect(generalErrorH1(page)).toBeVisible();
    await expect(generalErrorBody(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible();
  });

  test('404 route renders the NotFoundError surface', async ({ page }) => {
    // (errors)/404 registers `component: NotFoundError` on the router.
    await page.goto('/404');

    await expect(notFoundH1(page)).toBeVisible();
  });
});
