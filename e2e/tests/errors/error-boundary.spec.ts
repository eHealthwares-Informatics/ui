import { expect, test } from '../../fixtures/test';
import { generalErrorBody, generalErrorH1, notFoundH1 } from '../../utils/selectors';

test.describe('error boundary', () => {
  // TC-ERR-06 — /500 route renders the GeneralError surface.
  test('TC-ERR-06 — 500 route renders the GeneralError surface', async ({ page }) => {
    await page.goto('/500');

    await expect(generalErrorH1(page)).toBeVisible();
    await expect(generalErrorBody(page)).toBeVisible();
    await expect(page.getByTestId('error-back-to-home')).toBeVisible();
  });

  // TC-ERR-02 — /404 route renders the NotFoundError surface (via (errors)/404).
  test('TC-ERR-02 — 404 route renders the NotFoundError surface', async ({ page }) => {
    await page.goto('/404');

    await expect(notFoundH1(page)).toBeVisible();
  });
});
