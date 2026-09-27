import { expect, test } from '../../fixtures/test';
import { notFoundBody, notFoundButtons, notFoundH1 } from '../../utils/selectors';

test.describe('error status pages', () => {
  // TC-ERR-01..06 map the six dedicated error routes under src/routes/(errors):
  // /401 /403 /404 /500 /503 /service-unavailable. Each renders a Mantine
  // <Title order={1}> with the status text (verified in source):
  //   unauthorized-error.tsx → "401", forbidden.tsx → "403",
  //   maintenance-error.tsx → "503", service-unavailable-error.tsx →
  //   "Service Unavailable".
  // Heading assertion tolerance: `getByRole('heading')` requires heading
  // semantics — Mantine Title renders an <h1>, so it matches.
  // NOTE: the /service-unavailable route polls its API with automatic retries;
  // only assert static render output there.

  // TC-ERR-01 — /401 renders the Unauthorized surface.
  test('TC-ERR-01 — 401 page renders unauthorized surface', async ({ page }) => {
    await page.goto('/401');

    const h1 = page.getByRole('heading', { name: '401' });
    await expect(h1).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Unauthorized Access')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible();
  });

  // TC-ERR-03 — /403 renders the Forbidden surface.
  test('TC-ERR-03 — 403 page renders forbidden surface', async ({ page }) => {
    await page.goto('/403');

    await expect(page.getByRole('heading', { name: '403' })).toBeVisible({ timeout: 20_000 });
  });

  // TC-ERR-04 — /404 renders the NotFoundError surface (already covered in
  // depth by not-found.spec.ts; asserted here so every error route has a TC).
  test('TC-ERR-04 — 404 page renders not-found surface', async ({ page }) => {
    await page.goto('/404');

    await expect(notFoundH1(page)).toBeVisible({ timeout: 20_000 });
    await expect(notFoundBody(page)).toBeVisible();

    const { goBack, backToHome } = notFoundButtons(page);
    await expect(goBack).toBeVisible();
    await expect(backToHome).toBeVisible();
  });

  // TC-ERR-05 — /503 renders the Maintenance surface.
  test('TC-ERR-05 — 503 page renders maintenance surface', async ({ page }) => {
    await page.goto('/503');

    await expect(page.getByRole('heading', { name: '503' })).toBeVisible({ timeout: 20_000 });
  });

  // TC-ERR-06 — /500 renders the GeneralError surface (shared with
  // error-boundary.spec.ts).
  test('TC-ERR-06 — 500 page renders general error surface', async ({ page }) => {
    await page.goto('/500');

    await expect(page.getByTestId('error-general-h1')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('error-general-body')).toBeVisible();
  });
});
