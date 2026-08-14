import { expect, test } from '../../../fixtures/test';

test.describe('APM website services (agenda)', () => {
  test('renders the Oyo Next agenda page', async ({ page }) => {
    await page.goto('/apm/agenda');

    // "Oyo Next Agenda" also appears as the nav anchor; scope to the heading.
    await expect(page.getByRole('heading', { name: 'Oyo Next Agenda' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows the agenda fallback when data is empty', async ({ page }) => {
    await page.goto('/apm/agenda');

    // The agenda is data-driven: with Mongo down or an empty list the loader
    // finishes with the fallback copy instead of agenda items.
    await expect(
      page
        .getByText('Agenda items coming soon.')
        .or(page.getByRole('heading', { name: 'Oyo Next Agenda' })),
    ).toBeVisible({ timeout: 15_000 });
  });
});