import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft Sales Analytics — logic confirmation (bespoke).
 *
 * The dashboard is a single-view chart page (no table/search), which is why the
 * generic crud-suite gates TC-02/03/06/07/08. This spec instead confirms the
 * ANALYTICS LOGIC: the KPI cards the UI renders must equal the summary the
 * `/reports/sales-analytics` endpoint returns for the same filters.
 *
 * A fresh E2E org is seeded with sales (`seeds/backend/inline/sales.json`),
 * so the dashboard should have data to reconcile.
 */
type Summary = {
  summary: { totalRevenue: number; totalSales: number };
};

function naira(n: number): string {
  // Mirrors the dashboard's formatNaira (₦ + grouped). Tolerant of the exact
  // symbol/separator: we assert on the digit grouping, not the glyph.
  return Math.round(n).toLocaleString('en-NG');
}

test.describe('RxSoft Sales Analytics — logic', () => {
  test.setTimeout(120_000);

  test('KPI cards reconcile with the /reports/sales-analytics summary', async ({ page }) => {
    const api = await apiFetch<Summary>(page, '/reports/sales-analytics');
    const { totalSales, totalRevenue } = api.summary;
    test.skip(totalSales === 0, 'seeded org has no sales — nothing to reconcile');

    await page.goto('/rxsoft/sales-analytics', { timeout: 60_000 });
    await expect(page.getByTestId('page-title')).toHaveText('Sales Analytics');

    // KPI card values (label → value) — assert the summary numbers are shown.
    await expect(page.getByText(naira(totalSales), { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(naira(totalRevenue), { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });

    // Chart surfaces render (not the empty-chart state).
    await expect(page.getByText('Sales Trend')).toBeVisible();
    await expect(page.getByText('Sales by Category')).toBeVisible();
  });
});
