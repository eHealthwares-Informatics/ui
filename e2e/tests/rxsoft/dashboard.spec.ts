import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * RxSoft module dashboard — #191 / UC-RX-DASH-01 (ehealthwares/rxsoft#191).
 *
 * Covers:
 *   TC-RX-DASH-01  Dashboard renders (page + account panel + quick links)
 *   TC-RX-DASH-02  Widget empty/error — mocked 500s degrade to fallbacks,
 *                  page survives
 *
 * NOTE on TC-RX-DASH-01 wording: the board TC expects "three report widgets
 * render with values" (GET daily-sales / inventory-valuation /
 * top-selling-*). The /rxsoft/dashboard route was reworked into the generic
 * ModuleDashboardPage (features/rxsoft/pages/module-dashboard/page.tsx):
 * the "My Account & Activity" UserInsightsPanel plus quick links into the
 * module's resources. The three operational widgets moved to /rxsoft/reports
 * (covered with live endpoint assertions in reports.spec.ts
 * TC-RX-REPORTS-01). These tests assert the CURRENT page truthfully; the
 * board write-back documents the stale expectation.
 *
 * UserInsightsPanel data sources (verified in user-insights/api.ts):
 *   identity :8092  GET /auth/me, /auth/me/activity, /roles/catalog,
 *                   /role-requests/my
 *   rxsoft  :8080   GET /user-pos-config/me, /audit-logs/me
 */

const PANEL_HEADINGS = [
  'Session',
  'User',
  'Access',
  'Config',
  'My audit trail',
  'Roles & permission requests',
] as const;

test.describe('RxSoft dashboard', () => {
  test('/rxsoft redirects to the module root', async ({ page }) => {
    await page.goto('/rxsoft');

    // Module root for rxsoft is /rxsoft/dashboard (not the sales analytics route).
    await expect(page).toHaveURL(/\/rxsoft\/dashboard/);
    await expect(page.getByTestId('page-title')).toHaveText(/Dashboard/i);
  });

  // (The former "dashboard renders KPI cards from the reports endpoints" test
  // navigated to /dashboard/sales — that page is now covered properly, with
  // the correct error-state text, in tests/rxsoft/sales-analytics.spec.ts.)

  // ── TC-RX-DASH-01 ────────────────────────────────────────────

  test('TC-RX-DASH-01: module dashboard renders the account panel and quick links', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/dashboard');

    // Module landing title: "<Module> Dashboard".
    await expect(page.getByTestId('page-title')).toHaveText(/Dashboard/i);

    // The account panel mounts with all six widget headings (CardHeading
    // renders them independent of query state, so this is stable even
    // while identity data is still loading).
    for (const heading of PANEL_HEADINGS) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }

    // Quick links: the first six rxsoft module resources render as links
    // into /rxsoft/* (labels come from getModelConfig, falling back to the
    // resource id humanized).
    const quickLinksTitle = page.getByText('Quick links', { exact: true });
    await expect(quickLinksTitle).toBeVisible({ timeout: 30_000 });
    const quickLink = page.locator('a[href^="/rxsoft/"]');
    const linkCount = await quickLink.count();
    expect(linkCount, 'module dashboard must expose quick links').toBeGreaterThan(0);
  });

  // ── TC-RX-DASH-02 ────────────────────────────────────────────

  test('TC-RX-DASH-02: widget 500s degrade to fallbacks and the page survives', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Mock the panel's data sources to fail: identity activity + rxsoft
    // audit trail return 500. The board TC's "mock a report 500 → widget
    // shows fallback; page survives" against the current dashboard maps to
    // the UserInsightsPanel queries.
    await page.route('**/auth/me/activity**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );
    await page.route('**/audit-logs/me**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/rxsoft/dashboard');

    // Page survives: title and every widget heading still render — the
    // queries fail without unmounting the panel (no error boundary).
    await expect(page.getByTestId('page-title')).toHaveText(/Dashboard/i);
    for (const heading of PANEL_HEADINGS) {
      await expect(page.getByText(heading, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }

    // Widget fallback: Session's last-login value degrades to the timeAgo
    // null fallback "—" while quick links stay interactive.
    const sessionCard = page
      .getByText('Session', { exact: true })
      .first()
      .locator('xpath=ancestor-or-self::*[contains(@class, "mantine-Card-root")][1]');
    await expect(sessionCard).toContainText('—', { timeout: 30_000 });
    const quickLink = page.locator('a[href^="/rxsoft/"]');
    expect(await quickLink.count()).toBeGreaterThan(0);
  });
});
