import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft Purchases Analytics — logic confirmation (bespoke).
 *
 * Mirrors sales-analytics-bespoke: the page is a single-view chart dashboard
 * (no table/search → generic TC-02/03/06/07/08 gated). This confirms the
 * ANALYTICS LOGIC — the KPI cards must reconcile with the
 * `/reports/purchases-analytics` summary for the same filters.
 *
 * A fresh E2E org is seeded with purchase orders
 * (`seeds/backend/inline/purchase_orders.json`).
 */
type Summary = {
  summary: { totalValue: number; totalPOs: number; itemsPurchased: number };
};

function grouped(n: number): string {
  return Math.round(n).toLocaleString('en-NG');
}

test.describe('RxSoft Purchases Analytics — logic', () => {
  test.setTimeout(120_000);

  test('KPI cards reconcile with the /reports/purchases-analytics summary', async ({ page }) => {
    const api = await apiFetch<Summary>(page, '/reports/purchases-analytics');
    const { totalPOs, totalValue, itemsPurchased } = api.summary;
    test.skip(totalPOs === 0, 'seeded org has no purchase orders — nothing to reconcile');

    await page.goto('/rxsoft/purchases-analytics', { timeout: 60_000 });
    await expect(page.getByTestId('page-title')).toHaveText('Purchases Dashboard');

    await expect(page.getByText(grouped(totalPOs), { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(grouped(totalValue), { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });
    if (itemsPurchased > 0) {
      await expect(page.getByText(grouped(itemsPurchased), { exact: false }).first()).toBeVisible({
        timeout: 30_000,
      });
    }

    await expect(page.getByText('Purchase Trend')).toBeVisible();
    await expect(page.getByText('Purchase by Category')).toBeVisible();
  });
});
