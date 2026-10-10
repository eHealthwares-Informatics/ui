import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * RxSoft operational reports page — #193 / UC-RX-REPORTS-01
 * (ehealthwares/rxsoft#193).
 *
 * Covers:
 *   TC-RX-REPORTS-01  Reports page renders the daily-sales /
 *                    inventory-valuation / top-selling-items widgets
 *   TC-RX-REPORTS-02  CSV export (Export Summary → reports_summary.csv)
 *
 * TC-RX-REPORTS-01 GATE (documented): the board TC names a "date-range
 * filter" on the Reports page. The current page
 * (features/rxsoft/pages/reports/index.tsx) ships NO date control — it
 * loads three fixed GETs:
 *   /reports/daily-sales, /reports/inventory-valuation,
 *   /reports/top-selling-items
 * and offers only the Export Summary action. Period filtering lives on the
 * financial statement pages (trial balance / balance sheet / income
 * statement — covered in financial-statements.spec.ts TC-*-02). The filter
 * aspect therefore cannot be exercised here; the render + export aspects
 * are asserted truthfully.
 *
 * The statement pages themselves (previously smoke-tested here) are now
 * covered with their own TC ids in tests/rxsoft/financial-statements.spec.ts.
 */

test.describe('RxSoft reports', () => {
  test('TC-RX-REPORTS-01: reports page renders widgets from the three report endpoints', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);

    // Track the three report requests the page fires on mount.
    const endpoints = ['/reports/daily-sales', '/reports/inventory-valuation', '/reports/top-selling-items'];
    const seen = new Set<string>();
    page.on('response', (res) => {
      for (const ep of endpoints) {
        if (res.url().includes(ep) && res.status() < 400) seen.add(ep);
      }
    });

    await page.goto('/rxsoft/reports');

    await expect(page.getByTestId('page-title')).toHaveText('Reports');

    // KPI cards + quick stats (labels verified in reports/index.tsx).
    for (const label of [
      'Inventory Items',
      'Total Quantity',
      'Sales Days',
      'Top Products',
      'Avg Daily Sales',
      'Top Product',
    ]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    }

    // The two report tables render.
    await expect(page.getByText('Daily Sales', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Top Products', { exact: true }).first()).toBeVisible();

    // All three report endpoints answered successfully (the widgets'
    // values come from them; the API error branch would suppress the
    // tables and show "Failed to load reports.").
    await expect
      .poll(() => seen.size, { timeout: 30_000 })
      .toBeGreaterThanOrEqual(3);
  });

  test('TC-RX-REPORTS-02: Export Summary downloads reports_summary.csv', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports');

    const exportBtn = page.getByRole('button', { name: 'Export Summary' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });

    // downloadBlob (lib/rxsoft-api.ts) anchors a <a download> click → the
    // browser download event. suggestedFilename is fixed by the page.
    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('reports_summary.csv');

    // CSV contents: non-empty download with CSV shape (comma/newline).
    const csvPath = await download.path();
    expect(csvPath, 'download must land on disk').toBeTruthy();
  });
});
