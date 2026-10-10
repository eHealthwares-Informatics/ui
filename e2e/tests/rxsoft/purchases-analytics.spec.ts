import type { Page } from '@playwright/test';
import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { readFileSync } from 'node:fs';

/**
 * Purchases Analytics dashboard — #206 / UC-RX-PURCHASES-ANALYTICS-01/02/06/07
 * (ehealthwares/rxsoft#206). Route: /dashboard/purchases.
 *
 * Covers (12 TCs):
 *   TC-RX-PURCHASES-ANALYTICS-01  list renders (KPIs + charts + recent POs)
 *   TC-RX-PURCHASES-ANALYTICS-02  column sort            — GATE: no sortable
 *                                 table (Recent POs list is fixed)
 *   TC-RX-PURCHASES-ANALYTICS-03  pagination              — GATE: no pagination
 *   TC-RX-PURCHASES-ANALYTICS-04  empty state             (mocked empty payload)
 *   TC-RX-PURCHASES-ANALYTICS-05  loading state           (delayed API response)
 *   TC-RX-PURCHASES-ANALYTICS-06  search narrows list     — GATE: no search input
 *   TC-RX-PURCHASES-ANALYTICS-07  search clear            — GATE: no search input
 *   TC-RX-PURCHASES-ANALYTICS-08  debounced request       — GATE: filters are
 *                                 explicit Apply; param-reach exercised below
 *   TC-RX-PURCHASES-ANALYTICS-20  export triggers download (purchases_report.csv)
 *   TC-RX-PURCHASES-ANALYTICS-21  CSV contents
 *   TC-RX-PURCHASES-ANALYTICS-22  API error surfaces ("Failed to load
 *                                 purchases analytics.")
 *   TC-RX-PURCHASES-ANALYTICS-23  keyboard navigation to filter controls
 *
 * Business flow (verified in purchases-analytics/index.tsx +
 * use-purchases-analytics.ts):
 *   GET /reports/purchases-analytics?from&to[&warehouseId&categoryCode&supplierId]
 *   → KPI cards (Total Purchase Value, Total POs, Total Items Purchased,
 *   Average PO Value, Active Suppliers, Top Supplier) + charts (Purchase
 *   Trend, Purchase by Category, Purchase by Supplier, Purchase by
 *   Location, Spend by Supplier, PO Status Summary) + Recent Purchase
 *   Orders table (PO/Invoice, Date, Supplier, Status, Value).
 *   Export Report → GET /purchases/export → purchases_report.csv.
 */

const KPI_LABELS = [
  'Total Purchase Value',
  'Total POs',
  'Total Items Purchased',
  'Average PO Value',
  'Active Suppliers',
  'Top Supplier',
] as const;

const CHART_TITLES = [
  'Purchase Trend',
  'Purchase by Category',
  'Purchase by Supplier',
  'Purchase by Location',
  'Spend by Supplier',
  'PO Status Summary',
] as const;

/** Empty PurchasesAnalytics payload (shape from features/rxsoft/types.ts). */
const EMPTY_ANALYTICS = {
  summary: {
    totalValue: 0,
    totalPOs: 0,
    itemsPurchased: 0,
    averagePOValue: 0,
    activeSuppliers: 0,
    topSupplier: null,
  },
  trend: [],
  byCategory: [],
  bySupplier: [],
  byLocation: [],
  byStatus: [],
  recent: [],
};

const ANALYTICS_ROUTE = '**/reports/purchases-analytics**';

async function downloadText(download: import('@playwright/test').Download): Promise<string> {
  const path = await download.path();
  if (!path) return '';
  return readFileSync(path, 'utf-8');
}

async function tabToFilterControl(page: Page): Promise<boolean> {
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate(() => {
      const el = document.activeElement as HTMLInputElement | null;
      if (!el) return false;
      const placeholders = ['All Locations', 'Pick dates', 'All Categories', 'All Suppliers'];
      const isFilterInput =
        el instanceof HTMLInputElement && placeholders.includes(el.placeholder || '');
      const isFilterButton = /^(Apply Filters|Reset|Export Report)$/.test(
        (el.textContent || '').trim()
      );
      return isFilterInput || isFilterButton;
    });
    if (hit) return true;
  }
  return false;
}

test.describe('RxSoft Purchases Analytics (/dashboard/purchases)', () => {
  test('TC-RX-PURCHASES-ANALYTICS-01: analytics dashboard renders KPI cards, filters and charts', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);

    const initial = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/purchases-analytics') && res.url().includes('from='),
      { timeout: 45_000 }
    );
    await page.goto('/dashboard/purchases');
    expect((await initial).status(), 'default purchases-analytics request failed').toBeLessThan(
      400
    );

    await expect(page.getByTestId('page-title')).toHaveText('Purchases Dashboard');

    for (const label of ['Location', 'Date Range', 'Category', 'Supplier']) {
      await expect(page.getByLabel(label, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
    await expect(page.getByRole('button', { name: 'Apply Filters' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();

    for (const label of KPI_LABELS) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }

    for (const title of CHART_TITLES) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible({
        timeout: 15_000,
      });
    }

    // Recent Purchase Orders table renders with its fixed headers.
    await expect(page.getByText('Recent Purchase Orders', { exact: true }).first()).toBeVisible();
    for (const header of ['PO / Invoice', 'Date', 'Supplier', 'Status', 'Value']) {
      await expect(page.locator('th').filter({ hasText: header }).first()).toBeVisible();
    }

    await expect(page.getByRole('button', { name: 'Export Report' })).toBeVisible();
  });

  test('TC-RX-PURCHASES-ANALYTICS-02: column sort — GATE (Recent POs list is not sortable)', async () => {
    test.skip(
      true,
      'the Recent Purchase Orders table renders a fixed recent list with no sort controls; no other data table on the page'
    );
  });

  test('TC-RX-PURCHASES-ANALYTICS-03: pagination — GATE (single-view dashboard, no pagination)', async () => {
    test.skip(true, 'no pagination control on the purchases analytics dashboard');
  });

  test('TC-RX-PURCHASES-ANALYTICS-04: empty analytics payload renders the empty-chart state', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.route(ANALYTICS_ROUTE, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_ANALYTICS),
      })
    );

    await page.goto('/dashboard/purchases');
    await expect(page.getByTestId('page-title')).toHaveText('Purchases Dashboard');

    const emptyCharts = page.getByText('No data for the selected period');
    await expect(emptyCharts.first()).toBeVisible({ timeout: 30_000 });
    expect(
      await emptyCharts.count(),
      'chart cards must show the empty state'
    ).toBeGreaterThanOrEqual(3);

    // KPI cards still render with zeroed values.
    await expect(page.getByText('Total Purchase Value', { exact: true }).first()).toBeVisible();
  });

  test('TC-RX-PURCHASES-ANALYTICS-05: loading state shows the Loader until data arrives', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.route(ANALYTICS_ROUTE, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2_500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_ANALYTICS),
      });
    });

    await page.goto('/dashboard/purchases');

    await expect(page.locator('[class*="mantine-Loader"]').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Total Purchase Value', { exact: true }).first()).toBeHidden();

    await expect(page.getByText('Total Purchase Value', { exact: true }).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('TC-RX-PURCHASES-ANALYTICS-06: search narrows list — GATE (no search input; filter param-reach covered below)', async () => {
    test.skip(
      true,
      'analytics dashboard has no search input; narrowing is done via Location/Category/Supplier filters (param-reach asserted in the category filter test)'
    );
  });

  test('TC-RX-PURCHASES-ANALYTICS-07: search clear — GATE (no search input; Reset covered in TC-01 render)', async () => {
    test.skip(true, 'analytics dashboard has no search input to clear');
  });

  test('TC-RX-PURCHASES-ANALYTICS-08: debounced request — GATE (filters apply explicitly, no debounce)', async () => {
    test.skip(
      true,
      'no debounced search input; filters refetch immediately on selection (React Query key change) or via Apply Filters'
    );
  });

  test('filter control: category selection reaches the API as categoryCode', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/dashboard/purchases');

    const categorySelect = page.getByLabel('Category', { exact: true }).first();
    await expect(categorySelect).toBeVisible({ timeout: 30_000 });
    await categorySelect.click();

    if ((await page.getByRole('option').count()) === 0) {
      test.skip(true, 'no category options available (GET /categories empty)');
    }
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 15_000 });

    const refetch = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/purchases-analytics') &&
        res.url().includes('categoryCode='),
      { timeout: 30_000 }
    );
    await option.click();
    expect((await refetch).status(), 'filtered purchases-analytics request failed').toBeLessThan(
      400
    );
  });

  test('TC-RX-PURCHASES-ANALYTICS-20: Export Report triggers the purchases_report.csv download', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/dashboard/purchases');

    const exportBtn = page.getByRole('button', { name: 'Export Report' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('purchases_report.csv');
  });

  test('TC-RX-PURCHASES-ANALYTICS-21: exported CSV has contents', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/dashboard/purchases');

    const exportBtn = page.getByRole('button', { name: 'Export Report' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    const csv = await downloadText(download);
    expect(csv.length, 'exported CSV must not be empty').toBeGreaterThan(0);
    expect(csv, 'exported file must be CSV-shaped (comma or newline)').toMatch(/[,;\n]/);
  });

  test('TC-RX-PURCHASES-ANALYTICS-22: API error surfaces the failure card', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.route(ANALYTICS_ROUTE, (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/dashboard/purchases');

    await expect(page.getByText('Failed to load purchases analytics.')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('page-title')).toHaveText('Purchases Dashboard');
    await expect(page.getByRole('button', { name: 'Export Report' })).toBeVisible();
  });

  test('TC-RX-PURCHASES-ANALYTICS-23: filter controls are keyboard reachable', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/dashboard/purchases');
    await expect(page.getByTestId('page-title')).toHaveText('Purchases Dashboard');

    const reached = await tabToFilterControl(page);
    expect(reached, 'Tab navigation must reach the filter controls').toBe(true);
  });
});
