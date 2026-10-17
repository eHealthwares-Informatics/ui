import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft Website Orders — Advance / cancel a website order
 * UC-RX-WEBSITE-ORDERS-STATUS-01 (rxsoft-qa#741)
 *
 *   TC-RX-WEBSITE-ORDERS-STATUS-01 — order detail opens (line items + status)
 *   TC-RX-WEBSITE-ORDERS-STATUS-02 — advance status via the UI (chip updates, API confirms)
 *   TC-RX-WEBSITE-ORDERS-STATUS-03 — cancel via the UI (status → Cancelled, history records it)
 *
 * The API-only transition matrix lives in website-orders-bespoke.spec.ts. This
 * spec drives the same transitions THROUGH the /rxsoft/website-orders UI.
 *
 * Honest gap (TC-03): the cancel transition is recorded (from→to, changedBy) but
 * neither the API DTO nor the UI capture a free-text cancel REASON — see #741.
 */

const TS = Date.now().toString(36);

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

/** Search the list for an order and return its row. */
async function findOrderRow(
  page: import('@playwright/test').Page,
  orderNumber: string
): Promise<import('@playwright/test').Locator> {
  const search = page.getByTestId('header-search').first();
  await expect(search).toBeVisible();
  await search.fill(orderNumber);
  const row = page.getByTestId('data-table-row').filter({ hasText: orderNumber }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  return row;
}

test.describe
  .serial('RxSoft Website Orders — advance / cancel (UC-RX-WEBSITE-ORDERS-STATUS-01)', () => {
  test.setTimeout(120_000);

  let accessToken: string | null = null;
  let categoryId = '';
  let uomCategoryId = '';
  let uomId = '';
  let itemId = '';
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

    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `WebOrdStatus Item ${TS}`,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
      isActive: true,
    });
    itemId = item.id;
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-01: order detail opens with items and status', async ({
    page,
  }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    await expect(page.getByTestId('page-title').filter({ hasText: 'Website Orders' })).toHaveText(
      'Website Orders'
    );

    const row = await findOrderRow(page, order.orderNumber);
    await expect(row).toContainText('Pending');

    await row.getByTestId('row-view-order').click();

    // The detail modal content (Mantine's root wrapper reports hidden, so assert
    // on the inner elements): status badge + line items.
    await expect(page.getByTestId('order-detail-status')).toHaveText('Pending', {
      timeout: 20_000,
    });

    const items = page.getByTestId('order-detail-items');
    await expect(items).toBeVisible();
    await expect(items).toContainText(itemId);
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-02: advance status via the UI updates chip + API', async ({
    page,
  }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    const row = await findOrderRow(page, order.orderNumber);
    await row.getByTestId('row-view-order').click();

    await expect(page.getByTestId('order-detail-status')).toHaveText('Pending');

    // pending → confirmed (allowed transition; also recorded in status history).
    await page.getByTestId('order-detail-status-select').click();
    await page.getByRole('option', { name: 'Confirmed' }).click();

    await expect(page.getByTestId('order-detail-status')).toHaveText('Confirmed', {
      timeout: 20_000,
    });

    // API confirms the transition.
    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${order.id}`
    );
    expect(verified.orderStatus).toBe('confirmed');
  });

  test('TC-RX-WEBSITE-ORDERS-STATUS-03: cancel via the UI sets Cancelled and records history', async ({
    page,
  }) => {
    const order = await createOrder(page, itemId);
    createdOrderIds.push(order.id);

    await page.goto('/rxsoft/website-orders', { timeout: 60_000 });
    const row = await findOrderRow(page, order.orderNumber);
    await row.getByTestId('row-view-order').click();

    await page.getByTestId('order-detail-status-select').click();
    await page.getByRole('option', { name: 'Cancelled' }).click();

    await expect(page.getByTestId('order-detail-status')).toHaveText('Cancelled', {
      timeout: 20_000,
    });

    // API confirms cancelled.
    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${order.id}`
    );
    expect(verified.orderStatus).toBe('cancelled');

    // The status transition is recorded in history (the "reason" is the recorded
    // from→to change; the API captures no free-text reason — see #741).
    const history = await apiFetch<Array<{ fromStatus: string; toStatus: string }>>(
      page,
      `/website/admin/orders/${order.id}/status-history`
    );
    const entries = Array.isArray(history) ? history : [];
    expect(entries.some((h) => h.toStatus === 'cancelled')).toBe(true);
  });
});
