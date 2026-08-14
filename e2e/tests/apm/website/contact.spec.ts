import { expect, skipIfBackendDown, test } from '../../../fixtures/test';

test.describe('APM website contact', () => {
  test('renders the contact form with all fields', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo, 'apm');
    await page.goto('/apm/contact');

    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();

    for (const field of ['Name', 'Email', 'Phone', 'Subject', 'Message']) {
      await expect(page.getByLabel(field)).toBeVisible();
    }
  });
});