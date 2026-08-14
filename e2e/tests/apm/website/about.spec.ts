import { expect, test } from '../../../fixtures/test';

test.describe('APM website about', () => {
  test('renders the Meet page heading', async ({ page }) => {
    await page.goto('/apm/meet');

    await expect(page.getByRole('heading', { name: 'Meet Bimbo Adekanmbi' })).toBeVisible();
  });
});