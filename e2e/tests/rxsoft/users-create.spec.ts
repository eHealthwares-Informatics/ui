import { expect, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * RxSoft users — UI create (UC-RX-USERS-03).
 *
 * The crud-suite gates `users` create off (the modal needs a `password` plus a
 * `roles` multi-async-select). This spec drives the real modal:
 *   TC-RX-USERS-10 — required-field validation blocks the submit (zero POST)
 *   TC-RX-USERS-11 — successful create
 *   TC-RX-USERS-12 — created record appears in the list
 *   TC-RX-USERS-13 — cleanup (API delete)
 */
const TS = Date.now().toString(36);

test.describe('RxSoft users — create', () => {
  test.setTimeout(120_000);

  test('TC-RX-USERS-10..13: validation, create, appears, cleanup', async ({ page, request }) => {
    // Pick a seeded role name to satisfy the required roles multi-select.
    const rolesRes = await apiFetch<{ data?: Array<{ name?: string; code?: string }> }>(
      page,
      '/roles?limit=5'
    );
    const role = (rolesRes.data ?? []).find((r) => r.name || r.code);
    test.skip(!role, 'no roles available to assign (GET /roles empty)');
    const roleLabel = (role!.name ?? role!.code) as string;

    await page.goto('/rxsoft/users', { timeout: 60_000 });
    await expect(page.getByTestId('page-title')).toHaveText('Users');

    await page.getByTestId('header-new').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // ── TC-RX-USERS-10: empty submit is blocked, zero POSTs ────────────────
    let posts = 0;
    const onCreate = (req: import('@playwright/test').Request) => {
      if (req.method() === 'POST' && req.url().includes('/users')) posts += 1;
    };
    page.on('request', onCreate);
    await dialog.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(1_200);
    expect(posts, 'empty submit must not fire POST /users').toBe(0);

    // ── TC-RX-USERS-11/12: fill + create + appears ─────────────────────────
    const username = `e2euser-${TS}`;
    await dialog.getByTestId('field-username').fill(username);
    await dialog.getByTestId('field-password').fill(`Pw-${TS}-aA1!`);

    const rolesSelect = dialog.getByTestId('async-select-roles');
    await expect(rolesSelect).toBeVisible({ timeout: 10_000 });
    await rolesSelect.click();
    const roleOption = page.getByTestId(`async-option-${roleLabel}`).first();
    await expect(roleOption).toBeVisible({ timeout: 12_000 });
    await roleOption.click();
    // Close the multi-select dropdown before submitting.
    await page.keyboard.press('Escape');

    await dialog.getByRole('button', { name: 'Create' }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });

    await page.getByTestId('header-search').fill(username);
    await expect(
      page.getByTestId('data-table-body').locator('tr').filter({ hasText: username })
    ).toBeVisible({ timeout: 20_000 });

    // ── TC-RX-USERS-13: cleanup via API ────────────────────────────────────
    const listRes = await apiFetch<{ data?: Array<{ id?: string; username?: string }> }>(
      page,
      `/users?search=${encodeURIComponent(username)}&limit=5`
    );
    const created = (listRes.data ?? []).find((u) => u.username === username);
    if (created?.id) {
      await request.delete(`http://localhost:8080/api/users/${created.id}`).catch(() => undefined);
    }
  });
});
