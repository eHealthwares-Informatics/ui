import { expect, test } from '../../fixtures/test';
import { notFoundBody, notFoundButtons, notFoundH1 } from '../../utils/selectors';

test.describe('not-found (404) page', () => {
  // The error routes render the shared error surfaces directly. NOTE: unmatched
  // URLs (e.g. any unknown path) are swallowed by the global auth shell rather
  // than the router's notFoundComponent, so we assert the component via its
  // dedicated /404 route instead of relying on live catch-all routing.
  test('renders the 404 page with recovery actions', async ({ page }) => {
    await page.goto('/404');

    await expect(notFoundH1(page)).toBeVisible();
    await expect(notFoundBody(page)).toBeVisible();

    const { goBack, backToHome } = notFoundButtons(page);
    await expect(goBack).toBeVisible();
    await expect(backToHome).toBeVisible();
  });
});