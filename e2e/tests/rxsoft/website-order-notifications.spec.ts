import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * Website Orders — order notification settings (SRS 7.9 order-lifecycle
 * switches) — eHealthwares-Informatics/ui#131 (backend rxsoft#18 / #67).
 *
 * The NotificationSettingsButton on /rxsoft/website-orders opens a
 * channel (Email/SMS/WhatsApp) × scenario matrix per facility:
 *   - scenarios: Order confirmation · Payment confirmation · Status changed ·
 *     Payment / receivable · Dispatch · Delivery (the SRS 7.9 lifecycle
 *     entries are: order_confirmation, payment_confirmation, dispatch,
 *     delivery)
 *   - GET  /orders/admin/notification-settings/:orgId   (missing keys default on)
 *   - PUT  /orders/admin/notification-settings/:orgId   { settings } → toast
 *     "Notification settings saved." and the modal closes
 */

test.describe.serial('Website Orders — order notification settings (ui#131)', () => {
  test('matrix renders all SRS 7.9 lifecycle scenarios across the three channels', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/website-orders');

    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Order Notification Settings')).toBeVisible({ timeout: 15_000 });

    // Channel columns.
    for (const channel of ['Email', 'SMS', 'WhatsApp']) {
      await expect(page.getByText(channel, { exact: true }).first()).toBeVisible();
    }
    // All six scenarios — incl. the four SRS 7.9 additions (#131).
    for (const scenario of [
      'Order confirmation',
      'Payment confirmation',
      'Status changed',
      'Payment / receivable',
      'Dispatch',
      'Delivery',
    ]) {
      await expect(page.getByText(scenario, { exact: true }).first()).toBeVisible();
    }

    // Facility picker + save controls.
    await expect(page.getByLabel('Facility (organisation)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('choosing a facility loads its switches and a toggle persists via PUT', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/website-orders');
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Order Notification Settings')).toBeVisible({ timeout: 15_000 });

    // Pick the first facility — GET .../notification-settings/:orgId fires.
    const facility = page.getByLabel('Facility (organisation)');
    await facility.click();
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    const getReq = page.waitForResponse(
      (res) =>
        /\/api\/orders\/admin\/notification-settings\/[^/]+/.test(res.url()) &&
        res.request().method() === 'GET',
      { timeout: 20_000 }
    );
    await option.click();
    expect((await getReq).status()).toBeLessThan(400);

    // Toggle the "Dispatch" scenario switch (row label anchors the row).
    const dispatchRow = page.getByText('Dispatch', { exact: true }).first();
    const rowScope = dispatchRow.locator(
      'xpath=ancestor-or-self::*[.//input[@type="checkbox"] or @role="switch"][1]'
    );
    const toggle = rowScope.locator('button[role="switch"], input[type="checkbox"]').first();
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    const before = await toggle.getAttribute('aria-checked').catch(() => null);
    await toggle.click();

    // Save → PUT with the settings payload + success toast + modal closes.
    const putReq = page.waitForResponse(
      (res) =>
        /\/api\/orders\/admin\/notification-settings\/[^/]+/.test(res.url()) &&
        res.request().method() === 'PUT',
      { timeout: 20_000 }
    );
    await page.getByRole('button', { name: 'Save' }).click();
    const put = await putReq;
    expect(put.status(), 'notification settings PUT failed').toBeLessThan(400);
    await expect(page.getByText('Notification settings saved.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Order Notification Settings')).toBeHidden();

    // Restore: reopen, toggle back, save again (no residual mutation).
    await page.getByRole('button', { name: 'Notifications' }).click();
    await expect(page.getByText('Order Notification Settings')).toBeVisible({ timeout: 15_000 });
    await facility.click();
    await page.getByRole('option').first().click();
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    const after = await toggle.getAttribute('aria-checked').catch(() => null);
    if (after !== before) {
      await toggle.click();
      const restore = page.waitForResponse(
        (res) =>
          /\/api\/orders\/admin\/notification-settings\/[^/]+/.test(res.url()) &&
          res.request().method() === 'PUT',
        { timeout: 20_000 }
      );
      await page.getByRole('button', { name: 'Save' }).click();
      expect((await restore).status()).toBeLessThan(400);
      await expect(page.getByText('Notification settings saved.')).toBeVisible({ timeout: 10_000 });
    }
  });
});
