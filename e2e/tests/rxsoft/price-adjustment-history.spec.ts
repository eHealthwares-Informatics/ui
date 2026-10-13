import type { Page } from '@playwright/test';
import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * Price Adjustment History — /rxsoft/price-adjustments
 * (backend eHealthwares-Informatics/rxsoft#68 + frontend
 * eHealthwares-Informatics/ui#133; QA epic "Price provenance +
 * price-adjustment audit").
 *
 * Backend #68 enriches `GET /price-adjustments` rows with display names
 * (itemName / itemCode / priceListName / locationName) instead of bare
 * UUIDs; UI #133 renders the append-only history page:
 *   - filters: Item (async search, 2+ chars), Price list (GET /price-lists),
 *     From / To DatePickerInputs, Clear
 *   - table: Date | Item (name + code) | Price list | Old → New (currency
 *     money) | Δ badge (red < 0, green > 0) | Reason | By (userId[0..8])
 *   - footer: "<total> adjustments" + client-side Mantine Pagination (20/page)
 *   - deep-link: ?itemId=<uuid> preselects the item filter
 */

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** PR #68-shaped enriched payload (mirrors the backend unit-test fixture). */
const ENRICHED = {
  data: [
    {
      id: 'pa-1',
      priceListId: 'pl-1',
      priceListName: 'Retail',
      itemId: 'it-1',
      itemName: 'Paracetamol',
      itemCode: 'PCM',
      locationName: 'Main Store',
      reason: 'promo',
      delta: -50,
      oldUnitPrice: 500,
      newUnitPrice: 450,
      currencyCode: 'NGN',
      performedByUserId: 'u1-test-user-uuid',
      performedAt: '2026-01-05T10:00:00.000Z',
    },
    {
      id: 'pa-2',
      priceListId: 'pl-1',
      priceListName: 'Retail',
      itemId: 'it-1',
      itemName: 'Paracetamol',
      itemCode: 'PCM',
      locationName: 'Main Store',
      reason: 'cost update',
      delta: 25,
      oldUnitPrice: 450,
      newUnitPrice: 475,
      currencyCode: 'NGN',
      performedByUserId: 'u1-test-user-uuid',
      performedAt: '2026-01-06T09:30:00.000Z',
    },
  ],
  meta: { total: 45 },
};

const HISTORY_ROUTE = '**/api/price-adjustments**';

async function fulfillHistory(page: Page, body: unknown): Promise<void> {
  await page.route(HISTORY_ROUTE, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

/** Opens the Mantine DatePickerInput anchored on its label and picks a day
 * (day buttons are accessible-named as full dates — see financial-statements.spec). */
async function pickDay(page: Page, label: string, day: number): Promise<void> {
  const control = page.getByLabel(label, { exact: true }).first();
  await expect(control).toBeVisible({ timeout: 15_000 });
  await control.click();
  const now = new Date();
  const dayBtn = page
    .getByRole('button', {
      name: `${day} ${EN_MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      exact: true,
    })
    .last();
  await expect(dayBtn).toBeVisible({ timeout: 10_000 });
  await dayBtn.click();
}

test.describe('RxSoft Price Adjustment History', () => {
  test('renders the history page with filter card, table headers and count', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/price-adjustments');

    await expect(page.getByTestId('page-title')).toHaveText('Price Adjustment History', {
      timeout: 30_000,
    });
    await expect(
      page.getByText('Every price list item change, with the before/after price window and reason.')
    ).toBeVisible();

    // Filter card: all four filters + Clear.
    for (const label of ['Item', 'Price list', 'From', 'To']) {
      await expect(page.getByLabel(label, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();

    // Table headers (verified against ui#133 markup).
    for (const header of ['Date', 'Item', 'Price list', 'Old → New', 'Δ', 'Reason', 'By']) {
      await expect(page.locator('th').filter({ hasText: header }).first()).toBeVisible();
    }

    // Footer count line renders (live org may have rows or not).
    await expect(page.getByText(/\d+ adjustments?|^Loading…$/)).toBeVisible({ timeout: 30_000 });
  });

  test('renders the empty state for a zero-adjustment org', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Deterministic: fulfill with an empty page (the live org may or may not
    // have history; this pins the empty-row branch of ui#133).
    await fulfillHistory(page, { data: [], meta: { total: 0 } });

    await page.goto('/rxsoft/price-adjustments');
    await expect(page.getByText('No price adjustments found.')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('0 adjustments')).toBeVisible();
  });

  test('renders enriched display names, price window and delta badges (#68)', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await fulfillHistory(page, ENRICHED);

    await page.goto('/rxsoft/price-adjustments');

    // Item cell: display name (fw600) + dimmed code — the #68 enrichment.
    await expect(page.getByText('Paracetamol').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('PCM', { exact: true }).first()).toBeVisible();
    // Price list display name (not the UUID).
    await expect(page.getByText('Retail', { exact: true }).first()).toBeVisible();

    // Old → New window with currency formatting.
    await expect(page.getByText('NGN 500.00').first()).toBeVisible();
    await expect(page.getByText('NGN 475.00').first()).toBeVisible();

    // Δ badges: negative without sign, positive with "+".
    await expect(page.getByText('-50', { exact: true })).toBeVisible();
    await expect(page.getByText('+25', { exact: true })).toBeVisible();

    // Reason + By (userId sliced to 8 chars).
    await expect(page.getByText('promo', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('cost update', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('u1-test-').first()).toBeVisible();
  });

  test('filter changes reach the API as query params', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Real price lists from the provisioned org.
    const lists = await apiFetch<{ data?: Array<{ id: string; name: string }> }>(
      page,
      '/price-lists?limit=1'
    );
    test.skip(
      !lists.data?.length,
      'no price lists in this org — the Price list filter has nothing to select'
    );
    const list = lists.data![0];

    await page.goto('/rxsoft/price-adjustments');

    // Price list change → the history request carries priceListId.
    const listRequest = page.waitForResponse(
      (res) =>
        res.url().includes('/api/price-adjustments') &&
        res.url().includes(`priceListId=${list.id}`),
      { timeout: 30_000 }
    );
    const select = page.getByLabel('Price list', { exact: true }).first();
    await select.click();
    await page.getByRole('option', { name: list.name, exact: true }).first().click();
    expect((await listRequest).status()).toBeLessThan(400);

    // From date picker → the next request carries fromDate.
    const day = new Date().getDate() === 1 ? 2 : 1;
    const now = new Date();
    const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    const dateRequest = page.waitForResponse(
      (res) =>
        res.url().includes('/api/price-adjustments') && res.url().includes(`fromDate=${fromDate}`),
      { timeout: 30_000 }
    );
    await pickDay(page, 'From', day);
    expect((await dateRequest).status()).toBeLessThan(400);
  });

  test('deep-link ?itemId preselects the item filter and scopes the request', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    const items = await apiFetch<{ data?: Array<{ id: string }> }>(page, '/items?limit=1');
    test.skip(!items.data?.length, 'no items in this org to deep-link');

    const itemId = items.data![0].id;
    const scoped = page.waitForResponse(
      (res) =>
        res.url().includes('/api/price-adjustments') && res.url().includes(`itemId=${itemId}`),
      { timeout: 30_000 }
    );
    await page.goto(`/rxsoft/price-adjustments?itemId=${itemId}`);
    expect((await scoped).status(), 'deep-link must scope the history request').toBeLessThan(400);

    // Clear resets the deep-link filter (request no longer scoped).
    const unscoped = page.waitForResponse(
      (res) => res.url().includes('/api/price-adjustments') && !res.url().includes('itemId='),
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Clear' }).click();
    expect((await unscoped).status()).toBeLessThan(400);
  });

  test('pagination renders for >20 total and page changes request the next page', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await fulfillHistory(page, ENRICHED); // meta.total=45 → 3 pages

    await page.goto('/rxsoft/price-adjustments');

    // Footer shows the total; Mantine Pagination renders (>1 page).
    // NOTE: Mantine v9 Pagination does not expose an aria-label'd nav —
    // locate the component by its root class and click the page-2 button
    // (verified from the failure screenshot: buttons 1/2/3 render).
    await expect(page.getByText('45 adjustments')).toBeVisible({ timeout: 30_000 });
    const pagination = page.locator('.mantine-Pagination-root').first();
    await expect(pagination).toBeVisible({ timeout: 15_000 });

    // Clicking page 2 re-requests with page=2.
    const nextPage = page.waitForResponse(
      (res) => res.url().includes('/api/price-adjustments') && res.url().includes('page=2'),
      { timeout: 30_000 }
    );
    await pagination.getByRole('button', { name: '2', exact: true }).click();
    expect((await nextPage).status()).toBeLessThan(400);
  });
});
