import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft Website Orders — Advance / cancel a website order
 * UC-RX-WEBSITE-ORDERS-STATUS-01 (rxsoft-qa#741)
 *
 *   TC-RX-WEBSITE-ORDERS-STATUS-01 — order detail opens (a sub-page with a
 *     breadcrumb back to the list, line NAMES and a left→right progress)
 *   TC-RX-WEBSITE-ORDERS-STATUS-02 — advance status via the UI (chip updates, API confirms)
 *   TC-RX-WEBSITE-ORDERS-STATUS-03 — cancel via the UI with a recorded REASON
 *
 * The API-only transition matrix lives in website-orders-bespoke.spec.ts. This
 * spec drives the same transitions THROUGH the /rxsoft/website-orders UI.
 */

const TS = Date.now().toString(36);
const CANCEL_REASON = `E2E cancel reason ${TS}`;

async function apiCreate<T>(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiFetch<T>(page, path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Create a pending website order and return its id + order number. */
async function createOrder(
  page: import('@playwright/test').Page,
  itemId: string
): Promise<{ id: string; orderNumber: string }> {
  const created = await apiCreate<{ id: string; orderNumber?: string }>(page, '/website/orders', {
    paymentMethod: 'cash',
    origin: 'website',
    delivery: { address: '123 WebOrd Lane', city: 'Test City', phone: '08000000001' },
    items: [{ itemId, quantity: 2, unitPrice: 100 }],
  });
  let orderNumber = created.orderNumber ?? '';
  if (!orderNumber) {
    const detail = await apiFetch<{ orderNumber: string }>(
      page,
      `/website/admin/orders/${created.id}`
    );
    orderNumber = detail.orderNumber;
  }
  expect(orderNumber).toBeTruthy();
  return { id: created.id, orderNumber };
}

/** Search the list for an order, open its sub-page, and return when it renders. */
async function openOrderDetail(
  page: import('@playwright/test').Page,
  order: { id: string; orderNumber: string }
): Promise<void> {
  const search = page.getByTestId('header-search').first();
  await expect(search).toBeVisible();
  await search.fill(order.orderNumber);
  const row = page.getByTestId('data-table-row').filter({ hasText: order.orderNumber }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId('row-view-order').click();
  await expect(page).toHaveURL(new RegExp(`/rxsoft/website-orders/${order.id}`));
}

test.describe
  .serial('RxSoft Website Orders — advance / cancel (UC-RX-WEBSITE-ORDERS-STATUS-01)', () => {
  test.setTimeout(120_000);

  let accessToken: string | null = null;
  let categoryId = '';
  let uomCategoryId = '';
  let uomId = '';
  let itemId = '';
  let itemName = '';
  const createdOrderIds: string[] = [];

  test.afterAll(async ({ request }) => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
    async function del(path: string) {
      try {
        await request.delete(`http://localhost:8080/api${path}`, { headers });
      } catch {
        /* ignore */
      }
    }
    for (const id of createdOrderIds) {
      await del(`/website/admin/orders/${id}`);
    }
    if (itemId) await del(`/items/${itemId}`);
    if (uomId) await del(`/uoms/${uomId}`);
    if (uomCategoryId) await del(`/uom-categories/${uomCategoryId}`);
  });

  test('0. seeds a catalogue item for website orders', async ({ page }) => {
    accessToken = await readAccessToken(page);

    const uomCat = await apiCreate<{ id: string }>(page, '/uom-categories', {
      name: `WebOrdStatus UoM Cat ${TS}`,
    });
    uomCategoryId = uomCat.id;

    const uom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `WEBST_${TS}`,
      name: `WebOrdStatus Unit ${TS}`,
      uomType: 'reference',
      categoryId: uomCategoryId,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    uomId = uom.id;

    const cats = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
    categoryId = cats.data?.[0]?.id ?? '';
    expect(categoryId).toBeTruthy();

    itemName = `WebOrdStatus Item ${TS}`;
    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: itemName,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
      isActive: true,
    });
    itemId = item.id;
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-01: order detail sub-page opens with breadcrumb, progress and item names', async ({
    page,
  }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    await expect(page.getByTestId('page-title').filter({ hasText: 'Website Orders' })).toHaveText(
      'Website Orders'
    );

    await openOrderDetail(page, order);

    // Breadcrumb back to the list.
    await expect(page.getByRole('link', { name: 'Website Orders' })).toBeVisible();
    await expect(page.getByTestId('page-title')).toContainText(order.orderNumber);
    await expect(page.getByTestId('order-detail-status')).toHaveText('Pending');

    // Left→right fulfilment progress.
    await expect(page.getByTestId('order-progress')).toBeVisible();

    // Line items show the item NAME, never the raw id.
    const items = page.getByTestId('order-detail-items');
    await expect(items).toBeVisible();
    await expect(items).toContainText(itemName);
    await expect(items).not.toContainText(itemId);
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-02: advance status via the UI updates chip + API', async ({
    page,
  }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    await openOrderDetail(page, order);

    await expect(page.getByTestId('order-detail-status')).toHaveText('Pending');

    // pending → confirmed (allowed transition; also recorded in status history).
    await page.getByTestId('order-detail-status-select').click();
    await page.getByRole('option', { name: 'Confirmed' }).click();

    await expect(page.getByTestId('order-detail-status')).toHaveText('Confirmed', {
      timeout: 20_000,
    });

    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${order.id}`
    );
    expect(verified.orderStatus).toBe('confirmed');
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-03: cancel via the UI records the reason', async ({ page }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    await openOrderDetail(page, order);

    await page.getByTestId('order-detail-status-select').click();
    await page.getByRole('option', { name: 'Cancelled' }).click();

    // The reason prompt (was previously not captured at all).
    const reasonInput = page.getByTestId('cancel-reason-input');
    await expect(reasonInput).toBeVisible({ timeout: 15_000 });
    await reasonInput.fill(CANCEL_REASON);
    await page.getByTestId('cancel-reason-confirm').click();

    await expect(page.getByTestId('order-detail-status')).toHaveText('Cancelled', {
      timeout: 20_000,
    });

    // The reason is surfaced in the status history table.
    await expect(
      page.getByTestId('status-history-reason').filter({ hasText: CANCEL_REASON }).first()
    ).toBeVisible({ timeout: 15_000 });

    // API confirms cancelled AND that the reason was persisted.
    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${order.id}`
    );
    expect(verified.orderStatus).toBe('cancelled');

    const history = await apiFetch<Array<{ fromStatus: string; toStatus: string; reason: string }>>(
      page,
      `/website/admin/orders/${order.id}/status-history`
    );
    const entries = Array.isArray(history) ? history : [];
    const cancelEntry = entries.find((h) => h.toStatus === 'cancelled');
    expect(cancelEntry).toBeTruthy();
    expect(cancelEntry?.reason).toBe(CANCEL_REASON);
  });
});
