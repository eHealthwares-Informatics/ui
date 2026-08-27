import { expect, test } from '../../fixtures/test';
import { skipIfBackendDown } from '../../utils/skip-if';

/**
 * LIS module (backend :8002, lisApi). Page-render smokes for key pages.
 */
test.describe('LIS module', () => {
  const routes: Array<[string, string]> = [
    ['/lis', 'Laboratory Information System'],
    ['/lis/test-definitions', 'Test Definitions'],
    ['/lis/orders', 'Orders'],
  ];

  for (const [route, heading] of routes) {
    test(`renders ${route}`, async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'lis');
      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});