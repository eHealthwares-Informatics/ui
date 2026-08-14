import { expect, skipIfBackendDown, test } from '../../../fixtures/test';

test.describe('APM website home', () => {
  test('loads the homepage with key hero content', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo, 'apm');
    await page.goto('/apm');

    await expect(page.getByText('Bimbo Adekanmbi').first()).toBeVisible();
    await expect(page.getByText('Continuity with Competence').first()).toBeVisible();
    await expect(page.getByText('Join the Movement').first()).toBeVisible();
  });
});