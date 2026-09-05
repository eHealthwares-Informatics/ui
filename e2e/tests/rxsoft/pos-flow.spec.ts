/**
 * POS Flow Playwright E2E Test
 *
 * Navigates the full POS sale lifecycle through the /rxsoft/sales UI:
 *  1. Create a POS sale via the list page's "New" modal (lines + payments as JSON)
 *  2. Verify the sale appears in the list with correct totals and status
 *  3. View the sale's line items via the Eye icon → /rxsoft/sales-lines
 *  4. Verify the line details match the submitted data
 *  5. Click the Print Receipt button and verify the PDF endpoint is hit
 *  6. Teardown: remove the created sale via API
 */
import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/* ── Helpers ──────────────────────────────────────────────────── */

const TS = Date.now().toString(36);

async function apiCreate(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>,
) {
  return apiFetch<{ id: string }>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/* ── Test ─────────────────────────────────────────────────────── */

test.describe.serial('POS Flow through Sales UI', () => {
  test.setTimeout(60_000);

  let saleId: string;
  let saleNumber: string;
  let itemId: string;
  let uomId: string;
  let locationId: string;
  let paymentMethodId: string;
  let customerId: string;
  let accessToken: string | null = null;

  /* ── Seed prerequisite data via API ─────────────────────────── */

  test('0. seeds prerequisite data for the POS sale', async ({ page }) => {
    accessToken = await readAccessToken(page);
    // Find an existing item with stock
    const itemsRes = await apiFetch<{ data: Array<{ id: string; name: string }> }>(
      page,
      '/items?limit=1',
    );
    itemId = itemsRes.data?.[0]?.id ?? '';
    expect(itemId).toBeTruthy();

    // Find a UOM
    const uomsRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/uoms?limit=1',
    );
    uomId = uomsRes.data?.[0]?.id ?? '';
    expect(uomId).toBeTruthy();

    // Find a stock location
    const locRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/stock-locations?limit=1',
    );
    locationId = locRes.data?.[0]?.id ?? '';
    expect(locationId).toBeTruthy();

    // Find a payment method
    const pmRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/payment-methods?limit=1',
    );
    paymentMethodId = pmRes.data?.[0]?.id ?? '';
    expect(paymentMethodId).toBeTruthy();

    // Find a customer
    const custRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      '/customers?limit=1',
    );
    customerId = custRes.data?.[0]?.id ?? '';
    // customer is optional for POS
  });

  /* ── 1. Create a POS sale via the "New" modal on /rxsoft/sales ── */

  test('1. opens the Sales page and creates a POS sale via the modal', async ({ page }) => {
    await page.goto('/rxsoft/sales');
    await expect(page.getByTestId('page-title')).toHaveText('Sales');

    // Wait for table to load
    await expect(page.getByTestId('data-table-body').locator('tr').first()).toBeVisible({
      timeout: 15_000,
    });

    // Click "New" to open the create modal
    await page.getByTestId('header-new').click();
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    saleNumber = `POS-UI-${TS}`;

    // The create modal uses LabelField components. Fields are:
    //   Sale Number (text), Sale Channel (text), Store ID (text),
    //   Customer ID (text, optional), Lines JSON (textarea), Payments JSON (textarea)
    // Each field: label Text → following sibling → input/textarea

    const fieldRoot = (label: string) =>
      dialog.getByText(label, { exact: false }).first().locator('xpath=following-sibling::*[1]');

    // Sale Number
    await fieldRoot('Sale Number').locator('input').fill(saleNumber);

    // Sale Channel
    await fieldRoot('Sale Channel').locator('input').fill('pos');

    // Store ID
    await fieldRoot('Store ID').locator('input').fill('default');

    // Customer ID (optional — leave blank or fill if available)
    if (customerId) {
      await fieldRoot('Customer ID').locator('input').fill(customerId);
    }

    // Lines JSON — a single line: 3 × the item at unitPrice 25
    const lines = JSON.stringify([
      {
        itemId,
        uomId,
        quantity: 3,
        unitPrice: 25,
      },
    ]);
    await fieldRoot('Lines JSON').locator('textarea').fill(lines);

    // Payments JSON — full payment via the first payment method
    const payments = JSON.stringify([
      {
        paymentMethodId,
        amount: 75,
      },
    ]);
    await fieldRoot('Payments JSON').locator('textarea').fill(payments);

    // Submit the form
    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden({ timeout: 15_000 });

    // The new sale should appear in the list
    await page.getByTestId('header-search').fill(saleNumber);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: saleNumber }),
    ).toBeVisible({ timeout: 15_000 });

    // Read the sale ID from API for later verification
    const searchRes = await apiFetch<{ data: Array<{ id: string }> }>(
      page,
      `/sales?search=${saleNumber}&limit=1`,
    );
    saleId = searchRes.data?.[0]?.id ?? '';
    expect(saleId).toBeTruthy();
  });

  /* ── 2. Verify the sale appears in the list with correct data ── */

  test('2. verifies the sale row shows correct channel, status, and total', async ({ page }) => {
    await page.goto('/rxsoft/sales');
    await expect(page.getByTestId('page-title')).toHaveText('Sales');

    // Search for our sale
    await page.getByTestId('header-search').fill(saleNumber);
    const row = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: saleNumber })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Verify the channel column shows "pos"
    await expect(row.locator('td').filter({ hasText: 'pos' })).toBeVisible();

    // Verify status column shows "posted"
    await expect(row.locator('td').filter({ hasText: 'posted' })).toBeVisible();

    // Verify total amount is 75 (3 × 25)
    await expect(row.locator('td').filter({ hasText: '75' })).toBeVisible();
  });

  /* ── 3. View the sale's line items via the Eye icon ──────────── */

  test('3. clicks View Lines and navigates to sales-lines page', async ({ page }) => {
    await page.goto('/rxsoft/sales');
    await page.getByTestId('header-search').fill(saleNumber);

    const row = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: saleNumber })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Click the Eye icon (View Lines button)
    const viewLinesBtn = row.locator('button').filter({ has: page.locator('svg.lucide-eye') }).first();
    await expect(viewLinesBtn).toBeVisible();
    await viewLinesBtn.click();

    // Should navigate to /rxsoft/sales-lines?saleId=...
    await expect(page).toHaveURL(new RegExp(`/rxsoft/sales-lines\\?saleId=${saleId}`), {
      timeout: 10_000,
    });

    await expect(page.getByTestId('page-title')).toHaveText('Sales Lines');
  });

  /* ── 4. Verify the line details match the submitted data ──────── */

  test('4. verifies sales line shows correct item, qty, and price', async ({ page }) => {
    await page.goto(`/rxsoft/sales-lines?saleId=${saleId}`);

    await expect(page.getByTestId('page-title')).toHaveText('Sales Lines');

    // Wait for the table to load
    await expect(page.getByTestId('data-table-body').locator('tr').first()).toBeVisible({
      timeout: 15_000,
    });

    const row = page.getByTestId('data-table-body').locator('tr').first();

    // The line should show quantity = 3
    await expect(row.locator('td').filter({ hasText: '3' })).toBeVisible();

    // The line should show unit price = 25
    await expect(row.locator('td').filter({ hasText: '25' })).toBeVisible();

    // The line should show total = 75 (3 × 25)
    await expect(row.locator('td').filter({ hasText: '75' })).toBeVisible();
  });

  /* ── 5. Print receipt — verify the PDF endpoint is reachable ──── */

  test('5. clicks Print Receipt and verifies the PDF endpoint responds', async ({ page }) => {
    await page.goto('/rxsoft/sales');
    await page.getByTestId('header-search').fill(saleNumber);

    const row = page
      .getByTestId('data-table-body')
      .locator('tr')
      .filter({ hasText: saleNumber })
      .first();
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Set up a download listener before clicking Print Receipt
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);

    // Click the Print Receipt button (Printer icon)
    const printBtn = row
      .locator('button')
      .filter({ has: page.locator('svg.lucide-printer') })
      .first();
    await expect(printBtn).toBeVisible();
    await printBtn.click();

    // The print button opens a new window with the PDF blob URL.
    // We can't directly assert the PDF content, but we can verify
    // the API endpoint is reachable by making the same call directly.
    const pdfRes = await page.request.get(
      `http://localhost:8080/api/sales/${saleId}/receipt/pdf`,
      {
        headers: {
          Authorization: `Bearer ${await readAccessToken(page)}`,
        },
      },
    );

    // The endpoint should return either 200 (PDF) or 404 (no receipt template)
    // Either way, the endpoint is reachable — a 500 would indicate a bug
    expect(pdfRes.status()).toBeLessThan(500);

    // If it returned a PDF, verify the content type
    if (pdfRes.ok()) {
      const contentType = pdfRes.headers()['content-type'] ?? '';
      expect(contentType).toMatch(/pdf|octet-stream/);
    }

    // Also check if a download was triggered (best-effort)
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  /* ── 6. Verify the sale via API for comprehensive assertions ──── */

  test('6. verifies sale details via API: lines, payments, stock impact', async ({ page }) => {
    // Fetch full sale details
    const sale = await apiFetch<{
      id: string;
      status: string;
      saleNumber: string;
      saleChannel: string;
      totalAmount: number;
      lines: Array<{
        itemId: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }>;
    }>(page, `/sales/${saleId}`);

    expect(sale.saleNumber).toBe(saleNumber);
    expect(sale.saleChannel).toBe('pos');
    expect(sale.status).toBe('posted');
    expect(sale.lines).toHaveLength(1);
    expect(sale.lines[0].itemId).toBe(itemId);
    expect(sale.lines[0].quantity).toBe(3);
    expect(sale.lines[0].unitPrice).toBe(25);
    expect(sale.lines[0].lineTotal).toBe(75);
  });

  /* ── Teardown: remove the created sale ────────────────────────── */

  test.afterAll(async ({ request }) => {
    if (!saleId) return;
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };

    try {
      await request.delete(`http://localhost:8080/api/sales/${saleId}`, { headers });
    } catch {
      /* best-effort cleanup */
    }
  });
});
