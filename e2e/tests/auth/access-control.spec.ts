import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SignInPage } from '../../page-objects/sign-in.page';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Access-control Phase 1 (ui#145 → QA rxsoft-qa#795) — browser truth for
 * ROLE/MENU/SUBMENU enforcement:
 *  - ROLE: module list from GET /auth/me drives the /modules grid and landing
 *  - MENU/SUBMENU: sidebar groups/items tagged with permission codes are
 *    hidden when the user lacks them (wildcard matcher, "never hides what the
 *    API allows" — untagged entries stay visible)
 *  - PERMISSION_MODE: consumed into the auth store (rxsoft-admin-auth)
 *
 * Subject: the seeded CASHIER role — exactly four codes:
 *   rxsoft.catalog.item.read · rxsoft.sales.sale.create ·
 *   rxsoft.sales.sale.read · rxsoft.inventory.stock.read
 * so: Catalog + Operations (+ untagged Overview) stay visible; People
 * (identity.*), Payments, Finance, Website, Configuration and Shop are hidden.
 *
 * Uses the BASE @playwright/test fixture (no custom admin fixtures) so every
 * test runs in a fresh, unauthenticated context.
 */

const E2E_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type OrgUser = { username: string; password: string; roles: string[] };

function cashierCreds(): OrgUser {
  const state = JSON.parse(readFileSync(join(E2E_DIR, '.runtime', 'org-state.json'), 'utf-8')) as {
    users?: OrgUser[];
  };
  const cashier = (state.users ?? []).find((u) => (u.roles ?? []).includes('cashier'));
  if (!cashier) {
    throw new Error('org-state has no cashier user — provisioned org missing?');
  }
  return cashier;
}

async function signInAsCashier(page: Page): Promise<void> {
  const signIn = new SignInPage(page);
  const creds = cashierCreds();
  await signIn.goto();
  await signIn.fillUsername(creds.username);
  await signIn.fillPassword(creds.password);
  await signIn.submitButton.click();
  // Phase-1 targeting: single-module users land on their module; >1 land on
  // /modules. Either way we leave /sign-in.
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 30_000 });
}

test.describe('Access-control Phase 1 — restricted-role enforcement (ui#145 / #795)', () => {
  test('cashier login leaves /sign-in and lands in-app (single-module targeting)', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await signInAsCashier(page);
    // Single permitted module (rxsoft) → the module surface, not the grid.
    await expect(page).toHaveURL(/\/(rxsoft|modules)/, { timeout: 30_000 });
  });

  test('PERMISSION_MODE=org and the module list are stored from /auth/me', async ({ page }) => {
    await page.goto('/sign-in');
    await signInAsCashier(page);

    const store = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('rxsoft-admin-auth') ?? '{}')
    );
    expect(store?.state?.permissionMode, 'cashier runs in org mode').toBe('org');
    const moduleIds = ((store?.state?.modules ?? []) as Array<{ id: string }>).map((m) => m.id);
    expect(moduleIds, 'cashier must have the rxsoft module').toContain('rxsoft');
    expect(moduleIds, 'cashier must NOT have shop.pos (no shop.pos code)').not.toContain('shop');
  });

  test('/modules grid shows only the permitted modules', async ({ page }) => {
    await page.goto('/sign-in');
    await signInAsCashier(page);
    await page.goto('/modules');

    // The grid renders one card per module with a module-card-<id>-title testid.
    await expect(page.getByTestId('module-card-rxsoft-title')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('module-card-shop-title')).toHaveCount(0);
    await expect(page.getByTestId('module-card-admin-title')).toHaveCount(0);
  });

  test('sidebar item gating: code-tagged items hidden, untagged stay visible (Phase-1 honesty)', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await signInAsCashier(page);
    await page.goto('/rxsoft/dashboard');

    // TAGGED items the cashier LACKS the code for → hidden.
    // (Group-level hiding is Phase-3 work: every rxsoft group currently has
    // untagged members — Customers/Suppliers/Categories etc. — which stay
    // visible by the "never hides what the API allows" invariant.)
    for (const href of [
      '/rxsoft/users',
      '/rxsoft/roles',
      '/rxsoft/reports',
      '/rxsoft/audit-logs',
    ]) {
      await expect(
        page.locator(`a[href="${href}"]`),
        `${href} (tagged, code lacking) must be hidden`
      ).toHaveCount(0, { timeout: 15_000 });
    }
    // TAGGED items the cashier HOLDS → visible.
    for (const href of ['/rxsoft/sales', '/rxsoft/inventory', '/rxsoft/items']) {
      // >= 1: the module dashboard's Quick links section also links here.
      await expect(
        page.locator(`a[href="${href}"]`),
        `${href} (tagged, code held) must stay visible`
      ).not.toHaveCount(0, { timeout: 15_000 });
    }
    // UNTAGGED items → always visible (Phase-1 invariant).
    for (const href of ['/rxsoft/customers', '/rxsoft/suppliers', '/rxsoft/categories']) {
      await expect(
        page.locator(`a[href="${href}"]`),
        `${href} (untagged) must stay visible`
      ).not.toHaveCount(0, { timeout: 15_000 });
    }
  });

  test('sidebar SUBMENU gating: Users hidden, POS visible (code-tagged items)', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await signInAsCashier(page);
    await page.goto('/rxsoft/dashboard');

    // Users is tagged rxsoft.identity.user.read — cashier lacks it.
    await expect(page.locator('a[href="/rxsoft/users"]')).toHaveCount(0, { timeout: 15_000 });
    // POS (/shop/pos) is tagged rxsoft.sales.sale.create — cashier HAS it.
    await expect(page.locator('a[href="/shop/pos"]')).not.toHaveCount(0, { timeout: 15_000 });
  });
});
