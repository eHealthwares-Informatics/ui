import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Self-serve onboarding + provisioning drift guard.
 *
 * The onboarding form is the only public write path that creates a tenant, so
 * this spec exercises it against the real identity service and then verifies
 * the provisioned rows through identity's status endpoint:
 *  - every role/user from the tenant template exists with the right grants
 *  - rxsoft catalogue/pricing/stock/POS/GL reference data exists
 *  - EMR departments/wards/beds/demo patients/visits/admissions exist
 *    (wards/beds were silently zero on fresh orgs before the 2026-11 fix)
 *  - deprovisioning empties every table (including the EMR clinical block)
 *
 * The tenant template is read from identity's org-template.json, so a template
 * change that is not reflected in the provisioned DB fails here. The identity ↔
 * seed template copies are compared by scripts/check-provision-drift.mjs.
 */

const E2E_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_ROOT = join(E2E_DIR, '..', '..');
const IDENTITY_BASE_URL = 'http://localhost:8092';
const TEMPLATE_PATH = join(
  REPO_ROOT,
  'identity',
  'src',
  'modules',
  'provision',
  'org-template.json'
);
const MODULE_DATA_PATH = join(REPO_ROOT, 'frontend', 'src', 'features', 'shared', 'module-data.ts');

type Template = {
  roles: Record<string, { permissions: string[] }>;
  users: Array<{ suffix: string; roles: string[] }>;
  departments: unknown[];
  wards: unknown[];
  bedsPerWard: number;
  demoPatients: unknown[];
  demoAdmissions: unknown[];
};

const template = JSON.parse(readFileSync(TEMPLATE_PATH, 'utf-8')) as Template;
const frontendModuleIds = [
  ...readFileSync(MODULE_DATA_PATH, 'utf-8').matchAll(/\bid: '([a-z][a-z-]*)'/g),
].map((m) => m[1]);

let identityUp = false;

async function probeIdentity(): Promise<boolean> {
  try {
    const res = await fetch(`${IDENTITY_BASE_URL}/provision/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

test.beforeAll(async () => {
  identityUp = await probeIdentity();
});

test.describe('onboard organisation', () => {
  test.setTimeout(300_000);
  let createdCode: string | null = null;

  test.afterAll(async () => {
    if (!createdCode) return;
    await fetch(`${IDENTITY_BASE_URL}/provision/${encodeURIComponent(createdCode)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(30_000),
    }).catch(() => undefined);
  });

  test('shows per-field validation and makes no request when the form is empty', async ({
    page,
  }) => {
    test.skip(!identityUp, 'identity service is not running');
    let posts = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/auth/onboard-organization')) {
        posts += 1;
      }
    });

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-onboard-link').click();
    await expect(page.getByTestId('onboard-organisation-form')).toBeVisible();

    await page.getByTestId('onboard-org-submit').click();

    await expect(page.getByTestId('onboard-org-name-error')).toBeVisible();
    await expect(page.getByTestId('onboard-org-code-error')).toBeVisible();
    await expect(page.getByTestId('onboard-org-email-error')).toBeVisible();
    await expect(page.getByTestId('onboard-org-password-error')).toBeVisible();
    await expect(page.getByTestId('onboard-org-error-summary')).toBeVisible();
    expect(posts, 'invalid form must not call the onboarding API').toBe(0);
  });

  test('rejects an invalid admin email without a request', async ({ page }) => {
    test.skip(!identityUp, 'identity service is not running');
    let posts = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/auth/onboard-organization')) {
        posts += 1;
      }
    });

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-onboard-link').click();
    await page.getByTestId('onboard-org-name').fill('Onboard Validation Org');
    await page.getByTestId('onboard-org-code').fill('ONBVALID');
    await page.getByTestId('onboard-org-email').fill('not-an-email');
    await page.getByTestId('onboard-org-password').fill('OnboardPass123!');
    await page.getByTestId('onboard-org-submit').click();

    await expect(page.getByTestId('onboard-org-email-error')).toContainText('valid admin email');
    expect(posts, 'invalid email must not call the onboarding API').toBe(0);
  });

  test('provisions a full tenant, lands on /modules and matches the template with no drift', async ({
    page,
  }) => {
    test.skip(!identityUp, 'identity service is not running');

    const stamp = Date.now().toString(36).toUpperCase();
    const code = `ONB${stamp}`;
    const email = `onb.${stamp.toLowerCase()}@ehealthwares.test`;
    const password = 'OnboardPass123!';
    createdCode = code;

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-onboard-link').click();
    await page.getByTestId('onboard-org-name').fill(`Onboard E2E ${stamp}`);
    await page.getByTestId('onboard-org-code').fill(code);
    await page.getByTestId('onboard-org-email').fill(email);
    await page.getByTestId('onboard-org-password').fill(password);

    await page.getByTestId('onboard-org-submit').click();
    await expect(page.getByTestId('onboard-org-progress')).toBeVisible();

    await page.waitForURL((url) => !url.pathname.includes('/sign-in'), { timeout: 240_000 });
    await expect(page).toHaveURL(/\/modules$/, { timeout: 30_000 });
    await expect(page.getByTestId('module-landing')).toBeVisible();

    // ── provisioned rows (identity status endpoint) ────────────────────
    const statusRes = await fetch(`${IDENTITY_BASE_URL}/provision/status/${code}`);
    expect(statusRes.ok, 'provision status should be readable').toBe(true);
    const status = (await statusRes.json()) as {
      exists: boolean;
      counts?: {
        identity: Record<string, number>;
        backend: Record<string, number>;
        emr: Record<string, number>;
      };
    };
    expect(status.exists).toBe(true);
    const counts = status.counts!;
    expect(counts, 'status must include provisioned row counts').toBeTruthy();

    expect(counts.identity.roles, 'role template size').toBe(Object.keys(template.roles).length);
    expect(counts.identity.users, 'user template size').toBe(template.users.length);
    expect(counts.identity.role_permissions, 'role grants must exist').toBeGreaterThan(0);
    expect(counts.identity.user_roles, 'user role links must exist').toBe(template.users.length);

    expect(counts.backend.organisation_items, 'item whitelist').toBeGreaterThan(0);
    expect(counts.backend.price_lists, 'retail price list').toBeGreaterThanOrEqual(1);
    expect(counts.backend.price_list_items, 'price list items').toBeGreaterThan(0);
    expect(counts.backend.stock_locations, 'stock locations').toBeGreaterThanOrEqual(3);
    expect(counts.backend.stock_balances, 'opening stock').toBeGreaterThan(0);
    expect(counts.backend.parties, 'demo parties').toBeGreaterThanOrEqual(4);
    expect(counts.backend.user_pos_configs, 'POS configs').toBeGreaterThanOrEqual(4);
    expect(counts.backend.gl_accounts, 'starter GL chart').toBeGreaterThanOrEqual(9);

    expect(counts.emr.departments, 'EMR departments').toBe(template.departments.length);
    expect(counts.emr.wards, 'EMR wards').toBe(template.wards.length);
    expect(counts.emr.beds, 'EMR beds').toBe(template.wards.length * template.bedsPerWard);
    expect(counts.emr.patients, 'demo patients').toBe(template.demoPatients.length);
    expect(counts.emr.visits, 'demo visits').toBe(template.demoAdmissions.length);
    expect(counts.emr.admissions, 'demo admissions').toBe(template.demoAdmissions.length);

    // ── template ↔ live role grants ─────────────────────────────────────
    const loginRes = await fetch(`${IDENTITY_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    expect(loginRes.ok, 'new owner must be able to sign in').toBe(true);
    const tokens = (await loginRes.json()) as { accessToken: string };
    const auth = (path: string) =>
      fetch(`${IDENTITY_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

    const me = (await (await auth('/auth/me')).json()) as {
      modules: Array<{ id: string }>;
      permissions: string[];
    };
    expect(me.modules.map((m) => m.id).sort()).toEqual([...frontendModuleIds].sort());
    expect(me.permissions).toContain('rxsoft');
    expect(me.permissions).toContain('emr');
    expect(me.permissions).toContain('lis');

    const rolesBody = (await (await auth('/roles?limit=500')).json()) as {
      data: Array<{ code: string; permissionCodes: string[] }>;
    };
    const roles = new Map(rolesBody.data.map((role) => [role.code, role.permissionCodes]));
    expect([...roles.keys()].sort()).toEqual(Object.keys(template.roles).sort());
    for (const [roleCode, tpl] of Object.entries(template.roles)) {
      expect(
        [...(roles.get(roleCode) ?? [])].sort(),
        `role ${roleCode} grants must match the template`
      ).toEqual([...tpl.permissions].sort());
    }

    const usersBody = (await (await auth('/users?limit=500')).json()) as {
      data: Array<{ username: string }>;
    };
    const usernames = new Set(usersBody.data.map((user) => user.username));
    expect(usernames.has(email), 'owner email is the login username').toBe(true);
    for (const user of template.users) {
      if (user.suffix === 'OWNER') continue;
      expect(usernames.has(`${code}_${user.suffix}`), `provisioned ${user.suffix}`).toBe(true);
    }

    // ── teardown empties every table, including the EMR clinical block ──
    type DeprovisionOutcome = {
      deprovisioned: boolean;
      tables: Array<{ name: string; outcome: string }>;
      failures: unknown[];
    };
    const deprovision = async (): Promise<DeprovisionOutcome> => {
      const res = await fetch(`${IDENTITY_BASE_URL}/provision/${code}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(90_000),
      });
      expect(res.ok, 'deprovision request should succeed').toBe(true);
      return (await res.json()) as DeprovisionOutcome;
    };

    let outcome = await deprovision();
    if (!outcome.deprovisioned) {
      // Deprovision is idempotent and keeps the organizations row as its retry
      // marker when a table/budget fails. One retry finishes a heavy teardown
      // that lost its budget under load without hiding a genuine failure.
      outcome = await deprovision();
    }
    expect(outcome.deprovisioned, JSON.stringify(outcome.failures)).toBe(true);
    for (const table of [
      'emr.admissions',
      'emr.visits',
      'emr.patients',
      'emr.beds',
      'emr.wards',
      'emr.departments',
    ]) {
      const row = outcome.tables.find((entry) => entry.name === table);
      expect(row, `${table} must be part of deprovision`).toBeTruthy();
      expect(row!.outcome, `${table} must be fully cleaned`).toBe('cleaned');
    }

    const after = (await (await fetch(`${IDENTITY_BASE_URL}/provision/status/${code}`)).json()) as {
      exists: boolean;
    };
    expect(after.exists, 'organisation must be gone after deprovision').toBe(false);
    createdCode = null;
  });
});
