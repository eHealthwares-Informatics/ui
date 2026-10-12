import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';

/**
 * RxSoft Website Orders — Bespoke Status Transitions (UC-RX-WEBSITE-ORDERS-01)
 *
 * Covers the admin status transitions that are specific to website orders:
 *   TC-WEB-ORD-ADVANCE-01: pending → confirmed (PATCH /status)
 *   TC-WEB-ORD-ADVANCE-02: confirmed → post-sale (POST /post-sale, creates draft sale)
 *   TC-WEB-ORD-ADVANCE-03: complete-sale (POST /complete-sale, posts the sale)
 *   TC-WEB-ORD-CANCEL-01: pending → cancelled (PATCH status: cancelled)
 *
 * List/pagination/sort/search/export are covered by crud-suite (view-only).
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

async function apiPatch<T>(
  page: import('@playwright/test').Page,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return apiFetch<T>(page, path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Helper: create a fresh website order */
async function createWebsiteOrder(
  page: import('@playwright/test').Page,
  itemId: string,
  customerId?: string
): Promise<{ id: string; orderStatus: string }> {
  const orderRes = await apiFetch<{ id: string; orderStatus: string }>(page, '/website/orders', {
    method: 'POST',
    body: JSON.stringify({
      paymentMethod: 'cash',
      origin: 'website',
      ...(customerId ? { customerId } : {}),
      delivery: {
        address: '123 WebOrd Lane',
        city: 'Test City',
        phone: '08000000000',
      },
      items: [
        {
          itemId,
          quantity: 5,
          unitPrice: 100,
        },
      ],
    }),
  });
  return { id: orderRes.id, orderStatus: orderRes.orderStatus };
}

test.describe.serial('RxSoft Website Orders — Bespoke Status Transitions', () => {
  test.setTimeout(120_000);

  let supplierId: string;
  let warehouseId: string;
  let itemId: string;
  let uomId: string;
  let websiteOrderId: string;
  let accessToken: string | null = null;
  let junksSalesLocationId: string;

  // ── Teardown ─────────────────────────────────────────────────
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
    if (websiteOrderId) await del(`/website/admin/orders/${websiteOrderId}`);
    if (junksSalesLocationId) await del(`/stock-locations/${junksSalesLocationId}`);
  });

  // ── 0. Seed prerequisites ────────────────────────────────────
  test('0. seeds supplier, warehouse, item, stock location for fulfilment', async ({ page }) => {
    // Serial suite: capture the admin token here so the afterAll teardown
    // can authenticate its DELETEs (previously never assigned — teardown
    // silently ran unauthenticated AND tripped oxlint prefer-const, the
    // single error keeping the npm test gate red, ui#66).
    accessToken = await readAccessToken(page);

    const supplier = await apiCreate<{ id: string }>(page, '/suppliers', {
      name: `WebOrd Sup ${TS}`,
      phone: '08000000003',
      email: `webord-sup-${TS}@test.com`,
      address: '123 WebOrd St',
    });
    supplierId = supplier.id;

    const loc = await apiCreate<{ id: string }>(page, '/stock-locations', {
      code: `WEB-FULFIL-${TS}`,
      name: `Web Fulfil Loc ${TS}`,
      locationType: 'internal',
      isActive: true,
    });
    junksSalesLocationId = loc.id;

    const uomCat = await apiCreate<{ id: string }>(page, '/uom-categories', {
      name: `WebOrd UoM Cat ${TS}`,
    });
    const uom = await apiCreate<{ id: string }>(page, '/uoms', {
      code: `WEB_UOM_${TS}`,
      name: `WebOrd Unit ${TS}`,
      uomType: 'reference',
      categoryId: uomCat.id,
      factor: 1,
      rounding: 1,
      isActive: true,
    });
    uomId = uom.id;

    const cats = await apiFetch<{ data: Array<{ id: string }> }>(page, '/categories?limit=1');
    const categoryId = cats.data?.[0]?.id ?? '';
    expect(categoryId).toBeTruthy();

    const item = await apiCreate<{ id: string }>(page, '/items', {
      name: `WebOrd Item ${TS}`,
      categoryId,
      baseUomId: uomId,
      purchaseUomId: uomId,
      saleUomId: uomId,
      isActive: true,
    });
    itemId = item.id;

    // Seed stock at fulfilment location so post-sale can complete
    await apiFetch(page, '/inventory/adjust-quantity', {
      method: 'POST',
      body: JSON.stringify({
        itemId,
        locationId: junksSalesLocationId,
        deltaQuantity: 100,
        reason: `Website order fulfilment seed ${TS}`,
        uomId,
      }),
    });
  });

  // ── TC-WEB-ORD-ADVANCE-01: pending → confirmed ──────────────
  test('TC-WEB-ORD-ADVANCE-01: pending → confirmed via PATCH /status', async ({ page }) => {
    const order = await createWebsiteOrder(page, itemId);
    websiteOrderId = order.id;
    expect(order.orderStatus).toBe('pending');

    // Advance to confirmed via admin API
    const confirmed = await apiPatch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${websiteOrderId}/status`,
      { status: 'confirmed' }
    );
    expect(confirmed.orderStatus).toBe('confirmed');

    // Verify via API (UI list search may have timing issues)
    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${websiteOrderId}`
    );
    expect(verified.orderStatus).toBe('confirmed');
  });

  // ── TC-WEB-ORD-ADVANCE-02: confirmed → post-sale (creates draft sale) ────
  test('TC-WEB-ORD-ADVANCE-02: confirmed → post-sale creates draft sale', async ({ page }) => {
    const order = await createWebsiteOrder(page, itemId);
    const orderId = order.id;
    expect(order.orderStatus).toBe('pending');

    // Advance to confirmed first
    await apiPatch(page, `/website/admin/orders/${orderId}/status`, { status: 'confirmed' });

    // Post-sale with fulfilment stock location
    const postSale = await apiFetch<{ sale?: { id: string } }>(
      page,
      `/website/admin/orders/${orderId}/post-sale`,
      {
        method: 'POST',
        body: JSON.stringify({ stockLocationId: junksSalesLocationId }),
      }
    );
    const saleId = postSale.sale?.id;
    expect(saleId).toBeTruthy();

    // Verify sale exists and is in draft status
    const sale = await apiFetch<{ status: string }>(page, `/sales/${saleId}`);
    expect(sale.status).toBe('draft');
  });

  // ── TC-WEB-ORD-ADVANCE-03: complete-sale posts the sale ───────
  test('TC-WEB-ORD-ADVANCE-03: complete-sale posts the draft sale', async ({ page }) => {
    const order = await createWebsiteOrder(page, itemId);
    const orderId = order.id;

    await apiPatch(page, `/website/admin/orders/${orderId}/status`, { status: 'confirmed' });
    const postSale = await apiFetch<{ sale?: { id: string } }>(
      page,
      `/website/admin/orders/${orderId}/post-sale`,
      {
        method: 'POST',
        body: JSON.stringify({ stockLocationId: junksSalesLocationId }),
      }
    );
    const saleId = postSale.sale?.id;
    expect(saleId).toBeTruthy();

    // Complete the sale (posts it, depletes stock)
    await apiFetch(page, `/website/admin/complete-sale/${saleId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    // Verify sale is now posted
    const sale = await apiFetch<{ status: string }>(page, `/sales/${saleId}`);
    expect(sale.status).toBe('posted');

    // Verify stock was depleted at fulfilment location
    const balances = await apiFetch<{
      data: Array<{ itemId: string; locationId: string; quantityOnHand: number }>;
    }>(page, `/inventory/stock-balances?itemId=${itemId}&limit=5`);
    const balance = (balances.data ?? []).find((b) => b.locationId === junksSalesLocationId);
    expect(balance?.quantityOnHand ?? 0).toBeLessThan(100); // depleted by 5
  });

  // ── TC-WEB-ORD-CANCEL-01: pending → cancelled ─────────────────
  test('TC-WEB-ORD-CANCEL-01: pending → cancelled via PATCH /status', async ({ page }) => {
    const order = await createWebsiteOrder(page, itemId);
    const orderId = order.id;
    expect(order.orderStatus).toBe('pending');

    const cancelled = await apiPatch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${orderId}/status`,
      { status: 'cancelled' }
    );
    expect(cancelled.orderStatus).toBe('cancelled');

    // Verify via API (UI list search may have timing issues)
    const verified = await apiFetch<{ orderStatus: string }>(
      page,
      `/website/admin/orders/${orderId}`
    );
    expect(verified.orderStatus).toBe('cancelled');
  });
});
