import { expect, test } from '../../fixtures/test';
import { skipIfBackendDown } from '../../utils/skip-if';

/**
 * Communication (Switch) module (backend :8003, communicationApi). Page-render
 * smokes. Skips when the backend is not running.
 */
test.describe('Communication module', () => {
  const routes: Array<[string, string]> = [
    ['/communication', 'Messages'],
    ['/communication/messages', 'Messages'],
    ['/communication/notification-templates', 'Notification Templates'],
  ];

  for (const [route, heading] of routes) {
    test(`renders ${route}`, async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'communication');
      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});