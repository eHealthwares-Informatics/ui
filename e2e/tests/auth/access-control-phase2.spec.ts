import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SignInPage } from '../../page-objects/sign-in.page';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Access-control Phase 2 — ACTIONS gating (ui#145 phase 2 → QA rxsoft-qa#796).
 *
 * The DataPageShell now consumes a per-page `permissions` action map
 * (`permits()` from lib/permissions): users/schema.ts declares
 * rxsoft.identity.user.{create,update,delete}, roles/schema.ts declares
 * rxsoft.identity.role.*. The seeded CASHIER holds no identity codes; the
 * org OWNER holds the parent `rxsoft.identity` grant (seed#20) which covers
 * the subtree via the wildcard matcher.
 */

const E2E_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type OrgUser = { username: string; password: string; roles: string[] };

function orgCreds(kind: 'owner' | 'cashier'): OrgUser {
  const state = JSON.parse(readFileSync(join(E2E_DIR, '.runtime', 'org-state.json'), 'utf-8')) as {
    users?: OrgUser[];
  };
  const needle = kind === 'owner' ? 'OWNER' : 'CASHIER';
  const user = (state.users ?? []).find((u) => u.username.includes(needle));
  if (!user) throw new Error(`org-state has no ${needle} user`);
  return user;
}

async function signIn(page: Page, kind: 'owner' | 'cashier'): Promise<void> {
  const creds = orgCreds(kind);
  const signInPage = new SignInPage(page);
  await signInPage.goto();
  await signInPage.fillUsername(creds.username);
  await signInPage.fillPassword(creds.password);
  await signInPage.submitButton.click();
  await expect(page).not.toHaveURL(/\/sign-in/, { timeout: 30_000 });
}

const rowActionButtons = (page: Page) =>
  page
    .getByTestId('data-table-body')
    .locator('button')
    .filter({ has: page.locator('svg.lucide-pencil, svg.lucide-trash-2') });

test.describe('Access-control Phase 2 — ACTIONS gating (ui#145 / rxsoft-qa#796)', () => {
  test('cashier on /rxsoft/users: no create button, no row edit/delete actions', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await signIn(page, 'cashier');
    await page.goto('/rxsoft/users');

    // No rxsoft.identity.user.create → header New absent.
    await expect(page.getByTestId('header-new')).toHaveCount(0, { timeout: 20_000 });
    // Whatever renders (list or error state), no pencil/trash row actions.
    expect(await rowActionButtons(page).count()).toBe(0);
  });

  test('owner on /rxsoft/users: create button and row actions present', async ({ page }) => {
    await page.goto('/sign-in');
    await signIn(page, 'owner');
    await page.goto('/rxsoft/users');

    await expect(page.getByTestId('header-new').first()).toBeVisible({ timeout: 30_000 });
    // The org has seeded users → at least one row with actions renders.
    await expect(rowActionButtons(page).first()).toBeVisible({ timeout: 30_000 });
  });

  test('cashier on /rxsoft/roles: no create button, no row edit/delete actions', async ({
    page,
  }) => {
    await page.goto('/sign-in');
    await signIn(page, 'cashier');
    await page.goto('/rxsoft/roles');

    await expect(page.getByTestId('header-new')).toHaveCount(0, { timeout: 20_000 });
    expect(await rowActionButtons(page).count()).toBe(0);
  });

  test('owner on /rxsoft/roles: create button and row actions present', async ({ page }) => {
    await page.goto('/sign-in');
    await signIn(page, 'owner');
    await page.goto('/rxsoft/roles');

    await expect(page.getByTestId('header-new').first()).toBeVisible({ timeout: 30_000 });
    await expect(rowActionButtons(page).first()).toBeVisible({ timeout: 30_000 });
  });
});
