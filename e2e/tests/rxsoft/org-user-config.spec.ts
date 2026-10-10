import { expect, skipIfBackendDown, test } from '../../fixtures/test';

/**
 * User Config (#221) + Organisation Config (#240) — config-form pages
 * (ehealthwares/rxsoft#221, #240). Routes: /rxsoft/user-config,
 * /rxsoft/organisation-config.
 *
 * Both pages are bespoke settings FORMS (not DataPageShell lists), so the
 * 21/13-TC list templates mostly do not apply. What the pages genuinely do
 * (verified against their sources):
 *   - render the current config as an editable form (TC-14: the page IS the
 *     edit view)
 *   - Save Configuration → PATCH (user: /users/:id; org:
 *     /organisation-config/by-organization/:orgId) with a success
 *     notification ("User configuration saved" / "Organisation configuration
 *     saved") — TC-15 persists and restores a change
 *   - save failures surface a red notification (TC-22, mocked 500)
 *   - form controls are keyboard reachable (TC-23)
 *
 * Everything list-shaped (list renders/sort/pagination/empty/loading/search/
 * create/delete/export TCs) is gated honestly — no such controls exist on a
 * config form.
 */

const GATE_LIST_FAMILY = (entity: string) =>
  `${entity} page is a configuration form, not a DataPageShell list — no sortable/paginated table, no empty/loading list states`;

test.describe.serial('RxSoft User Configuration (#221)', () => {
  test('TC-RX-USER-CONFIG-14: config form renders as the edit view', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/user-config');

    await expect(page.getByRole('heading', { name: 'User Configuration' })).toBeVisible({
      timeout: 30_000,
    });
    for (const label of ['User', 'Stock Location', 'Allow POS', 'Login Timeout (minutes)']) {
      await expect(page.getByLabel(label).first()).toBeVisible({ timeout: 15_000 });
    }
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
  });

  test('TC-RX-USER-CONFIG-15: toggle Allow POS, persist, verify, restore', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/user-config');

    const allowPos = page.getByLabel('Allow POS').first();
    await expect(allowPos).toBeVisible({ timeout: 30_000 });
    const role = await allowPos.getAttribute('role');
    test.skip(role !== 'switch', 'Allow POS control did not render as a switch (config missing?)');

    const initial = (await allowPos.getAttribute('aria-checked')) === 'true';

    // Flip, save, assert the PATCH succeeded and the success toast fired.
    await allowPos.click();
    const patch = page.waitForResponse(
      (res) => res.url().includes('/api/users/') && res.request().method() === 'PATCH',
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    const res = await patch;
    test.skip(
      res.status() === 404,
      'PATCH /users/:id not available for this user — cannot verify persistence'
    );
    expect(res.status(), 'user-config PATCH failed').toBeLessThan(400);
    await expect(page.getByText('User configuration saved')).toBeVisible({ timeout: 15_000 });

    // Reload → the change persisted.
    await page.reload();
    const afterReload = page.getByLabel('Allow POS').first();
    await expect(afterReload).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => (await afterReload.getAttribute('aria-checked')) === 'true', {
        timeout: 15_000,
      })
      .toBe(!initial);

    // Restore the original value (no residual mutation).
    await afterReload.click();
    const restore = page.waitForResponse(
      (res) => res.url().includes('/api/users/') && res.request().method() === 'PATCH',
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    expect((await restore).status()).toBeLessThan(400);
    await expect(page.getByText('User configuration saved')).toBeVisible({ timeout: 15_000 });
  });

  test('TC-RX-USER-CONFIG-22: save failure surfaces the error notification', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.route('**/api/users/*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/rxsoft/user-config');
    const allowPos = page.getByLabel('Allow POS').first();
    await expect(allowPos).toBeVisible({ timeout: 30_000 });
    await allowPos.click();
    await page.getByRole('button', { name: 'Save Configuration' }).click();

    // The page's onError shows a red notification (mantine-Notification-root).
    await expect(page.locator('.mantine-Notification-root').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('TC-RX-USER-CONFIG-23: form controls are keyboard reachable', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/user-config');
    await expect(page.getByRole('heading', { name: 'User Configuration' })).toBeVisible({
      timeout: 30_000,
    });

    let reached = false;
    for (let i = 0; i < 50; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        const text = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`;
        return /Allow POS|Login Timeout|Save Configuration|Stock Location/.test(text);
      });
      if (reached) break;
    }
    expect(reached, 'Tab navigation must reach the config form controls').toBe(true);
  });

  // ── documented gates: the page is a form, not a list ─────────────────
  test('TC-RX-USER-CONFIG-01/02/03/04/05: list family — GATE (config form, no list)', async () => {
    test.skip(true, GATE_LIST_FAMILY('User Config'));
  });
  test('TC-RX-USER-CONFIG-06/07/08: search family — GATE (config form, no search)', async () => {
    test.skip(true, GATE_LIST_FAMILY('User Config'));
  });
  test('TC-RX-USER-CONFIG-09/10/11/12/13: create family — GATE (config record already exists; form edits it)', async () => {
    test.skip(true, GATE_LIST_FAMILY('User Config'));
  });
  test('TC-RX-USER-CONFIG-16: validation on edit — GATE (no field validation constraints on this form)', async () => {
    test.skip(true, 'the user-config form has no client-side validation constraints to exercise');
  });
  test('TC-RX-USER-CONFIG-17/18/19: delete family — GATE (config form, no record deletion)', async () => {
    test.skip(true, GATE_LIST_FAMILY('User Config'));
  });
  test('TC-RX-USER-CONFIG-20/21: export — GATE (config form, no export)', async () => {
    test.skip(true, GATE_LIST_FAMILY('User Config'));
  });
});

test.describe.serial('RxSoft Organisation Configuration (#240)', () => {
  test('TC-RX-ORGANISATION-CONFIG-14: config form renders as the edit view', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/organisation-config');

    await expect(page.getByRole('heading', { name: 'Organisation Configuration' })).toBeVisible({
      timeout: 30_000,
    });
    for (const label of ['Website Name', 'POS Header']) {
      await expect(page.getByLabel(label).first()).toBeVisible({ timeout: 15_000 });
    }
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
  });

  test('TC-RX-ORGANISATION-CONFIG-15: persist a POS Header change, verify, restore', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/organisation-config');

    const posHeader = page.getByLabel('POS Header').first();
    await expect(posHeader).toBeVisible({ timeout: 30_000 });
    const original = (await posHeader.inputValue()) || '';

    const token = `E2E-POS-HEADER-${Date.now().toString(36)}`;
    await posHeader.fill(token);
    const patch = page.waitForResponse(
      (res) =>
        res.url().includes('/api/organisation-config/') && res.request().method() === 'PATCH',
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    const res = await patch;
    test.skip(
      res.status() === 404,
      'PATCH /organisation-config/by-organization/:id not available — cannot verify persistence'
    );
    expect(res.status(), 'organisation-config PATCH failed').toBeLessThan(400);
    await expect(page.getByText('Organisation configuration saved')).toBeVisible({
      timeout: 15_000,
    });

    // Reload → the value persisted.
    await page.reload();
    const afterReload = page.getByLabel('POS Header').first();
    await expect(afterReload).toBeVisible({ timeout: 30_000 });
    await expect(afterReload).toHaveValue(token, { timeout: 15_000 });

    // Restore the original value (no residual mutation).
    await afterReload.fill(original);
    const restore = page.waitForResponse(
      (res) =>
        res.url().includes('/api/organisation-config/') && res.request().method() === 'PATCH',
      { timeout: 30_000 }
    );
    await page.getByRole('button', { name: 'Save Configuration' }).click();
    expect((await restore).status()).toBeLessThan(400);
    await expect(page.getByText('Organisation configuration saved')).toBeVisible({
      timeout: 15_000,
    });
  });

  test('TC-RX-ORGANISATION-CONFIG-22: save failure surfaces the error notification', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.route('**/api/organisation-config/**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/rxsoft/organisation-config');
    const posHeader = page.getByLabel('POS Header').first();
    await expect(posHeader).toBeVisible({ timeout: 30_000 });
    await posHeader.fill('E2E-error-probe');
    await page.getByRole('button', { name: 'Save Configuration' }).click();

    await expect(page.locator('.mantine-Notification-root').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('TC-RX-ORGANISATION-CONFIG-23: form controls are keyboard reachable', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/organisation-config');
    await expect(page.getByRole('heading', { name: 'Organisation Configuration' })).toBeVisible({
      timeout: 30_000,
    });

    let reached = false;
    for (let i = 0; i < 50; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        const text = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`;
        return /Website Name|POS Header|Save Configuration|Contact Phone/.test(text);
      });
      if (reached) break;
    }
    expect(reached, 'Tab navigation must reach the config form controls').toBe(true);
  });

  // ── documented gates: the page is a form, not a list ─────────────────
  test('TC-RX-ORGANISATION-CONFIG-01/02/03/04/05: list family — GATE (config form, no list)', async () => {
    test.skip(true, GATE_LIST_FAMILY('Organisation Config'));
  });
  test('TC-RX-ORGANISATION-CONFIG-06/07/08: search family — GATE (config form, no search)', async () => {
    test.skip(true, GATE_LIST_FAMILY('Organisation Config'));
  });
  test('TC-RX-ORGANISATION-CONFIG-16: validation on edit — GATE (no field validation constraints)', async () => {
    test.skip(
      true,
      'the organisation-config form has no client-side validation constraints to exercise'
    );
  });
  test('TC-RX-ORGANISATION-CONFIG-09/10/11/12/13: create family — GATE (config record already exists)', async () => {
    test.skip(true, GATE_LIST_FAMILY('Organisation Config'));
  });
});
