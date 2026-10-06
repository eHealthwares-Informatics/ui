import { expect, test } from '../../fixtures/test';
import { readAccessToken } from '../../utils/api';

/**
 * RxSoft role requests — admin workflow page (Phase 3b Ops CRUD).
 *
 * Covers UC-RX-ROLE-REQUESTS-01 TC-01 (list renders) and UC-RX-ROLE-REQUESTS-04
 * (approve/reject a request — the page's edit surface) per
 * ehealthwares/rxsoft#185/#188. Role requests live on the identity service
 * (:8092); seeded via POST /role-requests as the admin user, then driven
 * through the /rxsoft/role-requests UI.
 */
const TS = Date.now().toString(36);
const IDENTITY_BASE = 'http://localhost:8092';

type IdentityJson = Record<string, any> | Array<Record<string, any>>;

async function identityFetch(
  page: import('@playwright/test').Page,
  path: string,
  init: RequestInit = {}
): Promise<IdentityJson> {
  const token = await readAccessToken(page);
  const res = await fetch(`${IDENTITY_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`identity ${path} failed: ${res.status} — ${bodyText.slice(0, 300)}`);
  }
  return bodyText ? (JSON.parse(bodyText) as IdentityJson) : {};
}

test.describe('RxSoft role requests', () => {
  test('TC-RX-ROLE-REQUESTS-01 + TC-RX-ROLE-REQUESTS-14 + TC-RX-ROLE-REQUESTS-15: list renders; approve and reject flows', async ({
    page,
  }) => {
    await page.goto('/rxsoft/role-requests', { timeout: 60_000 });

    // List renders — actual page heading is "Roles Request".
    await expect(page.getByRole('heading', { name: /Roles Request/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('th').filter({ hasText: 'User' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Role' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Actions' })).toBeVisible();

    // Seed two pending requests via identity (admin self-request).
    // Backend allows ONE pending request per role per user — use distinct codes.
    const catalog = await identityFetch(page, '/roles/catalog');
    const catalogList = Array.isArray(catalog) ? catalog : ((catalog as any).data ?? []);
    const codes: string[] = catalogList.map((r: Record<string, any>) => r.code).filter(Boolean);
    const approveCode = codes.find((c: string) => c && c !== 'admin') ?? codes[0];
    const rejectCode = codes.find((c: string) => c && c !== approveCode && c !== 'admin');
    test.skip(!approveCode || !rejectCode, 'need >=2 non-admin role catalog codes');

    await identityFetch(page, '/role-requests', {
      method: 'POST',
      body: JSON.stringify({ roleCode: approveCode, reason: `E2E approve ${TS}` }),
    });

    // Reload so the seeded pending row appears.
    await page.reload();
    await expect(page.getByRole('heading', { name: /Roles Request/ })).toBeVisible({
      timeout: 15_000,
    });

    // Approve flow: the pending row for approveCode → Approve → modal → Approve.
    const approveRow = page
      .locator('tbody tr')
      .filter({ hasText: approveCode })
      .filter({ hasText: 'pending' })
      .first();
    await expect(approveRow, 'seeded pending request visible').toBeVisible({
      timeout: 15_000,
    });
    await approveRow.getByRole('button', { name: 'Approve' }).click();
    const approveModal = page.getByRole('dialog', { name: /Approve role request/ });
    await expect(approveModal).toBeVisible({ timeout: 10_000 });
    await approveModal.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByText('Updated')).toBeVisible({ timeout: 15_000 });

    // Reject flow: seed a second request under a different code, then reject it.
    await identityFetch(page, '/role-requests', {
      method: 'POST',
      body: JSON.stringify({ roleCode: rejectCode, reason: `E2E reject ${TS}` }),
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: /Roles Request/ })).toBeVisible({
      timeout: 15_000,
    });
    const rejectRow = page
      .locator('tbody tr')
      .filter({ hasText: rejectCode })
      .filter({ hasText: 'pending' })
      .first();
    await expect(rejectRow, 'second seeded pending request').toBeVisible({ timeout: 15_000 });
    await rejectRow.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText('Updated')).toBeVisible({ timeout: 15_000 });
  });
});
