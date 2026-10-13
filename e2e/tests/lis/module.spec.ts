/**
 * LIS Hub Navigation — UC-LIS-HUB-01 (ehealthwares/rxsoft#739, parent #738).
 *
 * The LIS hub (`/lis`) renders a Grid of resource cards (`lisResources` from
 * `src/features/lis/schema/resources.ts` — 18 cards), each with a
 * "Manage <title>" Button linking to `/lis/<key>`.
 *
 * NOTE: several LIS pages (statuses, samples, qc-*, eqa-results, …) are NOT
 * hub cards — they are standalone routes reached from the sidebar. The hub
 * grid covers the 18 entries in schema/resources.ts only.
 *
 * TC-LIS-HUB-01 — Hub renders grid
 * TC-LIS-HUB-02 — Card navigation
 */
import { expect, skipIfBackendDown, test } from '../../fixtures/test';

test.describe('LIS Hub Navigation (UC-LIS-HUB-01)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo, 'lis');
    await page.goto('/lis', { waitUntil: 'domcontentloaded' });
  });

  test('TC-LIS-HUB-01: hub renders the resource grid', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo, 'lis');
    await expect(page.getByTestId('page-title').first()).toHaveText(
      'Laboratory Information System'
    );

    // Resource cards render for all sections — spot-check the full 18-card
    // grid (every entry in src/features/lis/schema/resources.ts).
    const manageButtons = [
      'Manage Test Definitions',
      'Manage Reference Ranges',
      'Manage Rejection Reasons',
      'Manage Programs',
      'Manage Location Types',
      'Manage Locations',
      'Manage Attributes',
      'Manage Sample Types',
      'Manage Priorities',
      'Manage Test Categories',
      'Manage Units of Measurement',
      'Manage LOINC',
      'Manage Test Sections',
      'Manage Methods',
      'Manage Panels',
      'Manage Patients',
      'Manage Orders',
      'Manage Results',
    ];
    for (const name of manageButtons) {
      // Button component={Link} renders an <a role="link"> — not a <button>.
      await expect(page.getByRole('link', { name })).toBeVisible({ timeout: 10_000 });
    }
  });

  test('TC-LIS-HUB-02: card navigates to its section', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo, 'lis');
    // First card hop: Methods.
    await page.getByRole('link', { name: 'Manage Methods' }).click();
    await expect(page).toHaveURL(/\/lis\/methods/);
    await expect(page.getByTestId('page-title').first()).toHaveText('Methods');

    // Return to the hub and hop to a second section: Test Definitions.
    await page.goto('/lis', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'Manage Test Definitions' }).click();
    await expect(page).toHaveURL(/\/lis\/test-definitions/);
    await expect(page.getByTestId('page-title').first()).toHaveText('Test Definitions');
  });
});
