import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import type { Page } from '@playwright/test';

/**
 * RxSoft financial statements — #195 / #197 / #199
 * (ehealthwares/rxsoft#195, #197, #199).
 *
 * Covers (9 TCs):
 *   TC-RX-TRIAL-BALANCE-01/02/03    render · period filter · export
 *   TC-RX-BALANCE-SHEET-01/02/03   render · period filter · export
 *   TC-RX-INCOME-STATEMENT-01/02/03 render · period filter · export
 *
 * Business flows (verified against the page sources):
 *   trial-balance/  GET /reports/trial-balance?asOfDate=<date>; table
 *                   Code/Account/Type/Debit/Credit + Totals row; empty →
 *                   "No data found for the selected date."; Export →
 *                   trial_balance_<date>.csv
 *   balance-sheet/   GET /reports/balance-sheet?asOfDate; Assets /
 *                   Liabilities / Equity sections + "Total Liabilities &
 *                   Equity"; Export → balance_sheet_<date>.csv
 *   income-statement/ GET /reports/income-statement?fromDate&toDate;
 *                   Revenue / Cost of Goods Sold / Gross Profit /
 *                   Operating Expenses / Net Income; Export →
 *                   income_statement_<from>_<to>.csv
 *
 * All statements ship a Mantine DatePickerInput ("As of date" / "From" /
 * "To") whose value change re-issues the report GET with the new date
 * params — that is the period filter (TC-*-02).
 */

/** Local (not UTC) date parts — the calendar shows the machine-local month. */
function localDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Day to pick in the calendar: avoid colliding with today (no refetch). */
function pickableDay(): number {
  return new Date().getDate() === 1 ? 2 : 1;
}

function pickedDateStr(day: number): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Opens the Mantine DatePickerInput anchored on its label and picks a day
 * of the visible month. Mantine renders a real <label for=…> so getByLabel
 * resolves the input; the calendar mounts in a portal with one button per
 * day whose accessible name is the day number. The popover auto-closes on
 * pick.
 */
async function pickDatePickerDay(page: Page, label: string, day: number): Promise<void> {
  const input = page.getByLabel(label, { exact: true });
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.click();
  const dayBtn = page.getByRole('button', { name: String(day), exact: true }).last();
  await expect(dayBtn).toBeVisible({ timeout: 10_000 });
  await dayBtn.click();
}

test.describe('RxSoft financial statements', () => {
  // ── Trial Balance (#199) ─────────────────────────────────────

  test('TC-RX-TRIAL-BALANCE-01: Trial Balance renders', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/trial-balance');

    await expect(page.getByTestId('page-title')).toHaveText('Trial Balance');
    await expect(page.getByText('As of date', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();

    // Either the account table rendered (Code/Account/Type/Debit/Credit
    // + Totals) or the honest empty state for the selected date — both are
    // valid renders depending on the org's ledger.
    const tableHeaders = page.locator('th').filter({ hasText: 'Account' });
    const emptyState = page.getByText('No data found for the selected date.');
    await expect
      .poll(async () => (await tableHeaders.count()) + (await emptyState.count()), { timeout: 30_000 })
      .toBeGreaterThan(0);
  });

  test('TC-RX-TRIAL-BALANCE-02: As-of-date filter reaches the API', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);

    // Default load: the report GET carries asOfDate=<today> (the picker's
    // initial value) — that is the period filter applied by default.
    const initial = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/trial-balance') &&
        res.url().includes(`asOfDate=${localDateStr()}`),
      { timeout: 30_000 }
    );
    await page.goto('/rxsoft/reports/trial-balance');
    expect((await initial).status(), 'default trial-balance request failed').toBeLessThan(400);

    // Change the period through the DatePickerInput → a second GET with
    // the picked asOfDate must fire.
    const day = pickableDay();
    const refetch = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/trial-balance') &&
        res.url().includes(`asOfDate=${pickedDateStr(day)}`),
      { timeout: 30_000 }
    );
    await pickDatePickerDay(page, 'As of date', day);
    expect((await refetch).status(), 'trial-balance refetch after date change failed').toBeLessThan(400);

    // Page survives the period change.
    await expect(page.getByTestId('page-title')).toHaveText('Trial Balance');
  });

  test('TC-RX-TRIAL-BALANCE-03: Trial Balance CSV export', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/trial-balance');

    const exportBtn = page.getByRole('button', { name: 'Export' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;
    // downloadBlob names the file `trial_balance_<asOfDate>.csv`.
    expect(download.suggestedFilename()).toMatch(/^trial_balance_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  // ── Balance Sheet (#195) ────────────────────────────────────

  test('TC-RX-BALANCE-SHEET-01: Balance Sheet renders', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/balance-sheet');

    await expect(page.getByTestId('page-title')).toHaveText('Balance Sheet');
    await expect(page.getByText('As of date', { exact: true })).toBeVisible();

    // sectionTable always renders the three sections + totals footer,
    // regardless of whether accounts exist.
    for (const section of ['Assets', 'Liabilities', 'Equity']) {
      await expect(
        page.getByRole('heading', { name: section, exact: true }).first()
      ).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByText('Total Liabilities & Equity').first()).toBeVisible();
  });

  test('TC-RX-BALANCE-SHEET-02: As-of-date filter reaches the API', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);

    const initial = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/balance-sheet') &&
        res.url().includes(`asOfDate=${localDateStr()}`),
      { timeout: 30_000 }
    );
    await page.goto('/rxsoft/reports/balance-sheet');
    expect((await initial).status(), 'default balance-sheet request failed').toBeLessThan(400);

    const day = pickableDay();
    const refetch = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/balance-sheet') &&
        res.url().includes(`asOfDate=${pickedDateStr(day)}`),
      { timeout: 30_000 }
    );
    await pickDatePickerDay(page, 'As of date', day);
    expect((await refetch).status(), 'balance-sheet refetch after date change failed').toBeLessThan(400);

    await expect(page.getByTestId('page-title')).toHaveText('Balance Sheet');
  });

  test('TC-RX-BALANCE-SHEET-03: Balance Sheet CSV export', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/balance-sheet');

    const exportBtn = page.getByRole('button', { name: 'Export' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^balance_sheet_\d{4}-\d{2}-\d{2}\.csv$/);
  });

  // ── Income Statement (#197) ─────────────────────────────────

  test('TC-RX-INCOME-STATEMENT-01: Income Statement renders', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/income-statement');

    await expect(page.getByTestId('page-title')).toHaveText('Income Statement');
    // DatePickerInput labels; exact match avoids "Customers" (substring 'to').
    await expect(page.getByText('From', { exact: true })).toBeVisible();
    await expect(page.getByText('To', { exact: true })).toBeVisible();

    for (const section of ['Revenue', 'Cost of Goods Sold', 'Gross Profit', 'Net Income']) {
      await expect(page.getByText(section, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByText('Operating Expenses', { exact: true }).first()).toBeVisible();
  });

  test('TC-RX-INCOME-STATEMENT-02: From/To period filter reaches the API', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    const year = new Date().getFullYear();

    // Defaults: From = Jan 1 of the current year, To = today.
    const initial = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/income-statement') &&
        res.url().includes(`fromDate=${year}-01-01`) &&
        res.url().includes(`toDate=${localDateStr()}`),
      { timeout: 30_000 }
    );
    await page.goto('/rxsoft/reports/income-statement');
    expect((await initial).status(), 'default income-statement request failed').toBeLessThan(400);

    // Move the "To" boundary through the picker → refetch with the new
    // toDate (fromDate stays at the year start).
    const day = pickableDay();
    const refetch = page.waitForResponse(
      (res) =>
        res.url().includes('/api/reports/income-statement') &&
        res.url().includes(`fromDate=${year}-01-01`) &&
        res.url().includes(`toDate=${pickedDateStr(day)}`),
      { timeout: 30_000 }
    );
    await pickDatePickerDay(page, 'To', day);
    expect((await refetch).status(), 'income-statement refetch after date change failed').toBeLessThan(400);

    await expect(page.getByTestId('page-title')).toHaveText('Income Statement');
  });

  test('TC-RX-INCOME-STATEMENT-03: Income Statement CSV export', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/reports/income-statement');

    const exportBtn = page.getByRole('button', { name: 'Export' });
    await expect(exportBtn).toBeVisible({ timeout: 30_000 });
    await expect(exportBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
    await exportBtn.click();
    const download = await downloadPromise;
    // downloadBlob names it income_statement_<from>_<to>.csv.
    expect(download.suggestedFilename()).toMatch(
      /^income_statement_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/
    );
  });
});
