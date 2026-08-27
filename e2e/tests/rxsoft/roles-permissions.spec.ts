import { expect, test } from '../../fixtures/test';
import { API_BASE_URL, readAccessToken } from '../../utils/api';

/**
 * RxSoft roles → permissions editor (tri-level checkboxes + save).
 *
 * Creates a throwaway role via API, opens its /permissions page, checks the
 * first module (adds every action permission), saves, verifies the
 * permissionCodes grew via API, then deletes the role.
 */
test.describe('RxSoft role permissions', () => {
  const code = `e2e_role_${Date.now().toString(36)}`;

  test('toggles a module and persists permissions', async ({ page, request }) => {
    await page.goto('/rxsoft/roles');
    const token = await readAccessToken(page);
    expect(token).toBeTruthy();
    const headers = { Authorization: `Bearer ${token}` };

    // Setup: create a throwaway role with no permissions.
    const created = await request.post(`${API_BASE_URL}/roles`, {
      headers,
      data: { code, name: `E2E Role ${code}` },
    });
    expect(created.ok()).toBeTruthy();
    const role = (await created.json()) as { id: string };
    const id = role.id;

    const before = (await (
      await request.get(`${API_BASE_URL}/roles/${id}`, { headers })
    ).json()) as { permissionCodes?: string[] };
    const beforeCount = before.permissionCodes?.length ?? 0;

    try {
      await page.goto(`/rxsoft/roles/${id}/permissions`);

      await page.addStyleTag({
        content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
      });

      await expect(page.getByRole('heading', { name: 'Role Permissions' })).toBeVisible({
        timeout: 15_000,
      });

      // Check the first module (a fresh role => unchecked => adds all its codes).
      await page.getByRole('checkbox').first().check();

      await page.getByRole('button', { name: 'Save Permissions' }).click();

      await expect(page.getByText('Permissions updated')).toBeVisible({ timeout: 15_000 });
      // After save the page navigates away from /permissions (the app bounces
      // the bare `/roles` target to a module root — accept either).
      await expect(page).not.toHaveURL(/\/permissions/, { timeout: 15_000 });

      const after = (await (
        await request.get(`${API_BASE_URL}/roles/${id}`, { headers })
      ).json()) as { permissionCodes?: string[] };
      expect(after.permissionCodes?.length ?? 0).toBeGreaterThan(beforeCount);
    } finally {
      // Cleanup: delete the throwaway role (idempotent).
      await request.delete(`${API_BASE_URL}/roles/${id}`, { headers });
    }
  });
});