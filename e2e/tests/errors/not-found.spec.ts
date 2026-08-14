import { expect, test } from '../../fixtures/test';
import { notFoundBody, notFoundButtons, notFoundH1 } from '../../utils/selectors';

test.describe('not-found (404) page', () => {
  // There is no root-level catch-all: a single-segment unknown path falls
  // into the _authenticated/$moduleId route (guarded), so a genuine 404 can
  // only surface from an unmatched nested route inside a public tree.
  test('unknown nested route renders the 404 page with recovery actions', async ({ page }) => {
    await page.goto('/apm/some-missing-page');

    await expect(notFoundH1(page)).toBeVisible();
    await expect(notFoundBody(page)).toBeVisible();

    const { goBack, backToHome } = notFoundButtons(page);
    await expect(goBack).toBeVisible();
    await expect(backToHome).toBeVisible();
  });

  test('unknown nested APM route renders the 404 page', async ({ page }) => {
    await page.goto('/apm/unknown-sub-page');

    await expect(notFoundH1(page)).toBeVisible();
    await expect(notFoundBody(page)).toBeVisible();
  });
});