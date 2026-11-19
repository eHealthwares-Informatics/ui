import { expect, test } from '@playwright/test';

/**
 * "or try our platform" demo chooser on the sign-in page.
 *
 * The demo users live in the seeded DEFAULT organisation and each holds the
 * matching module-admin role (`demo_rxsoft` → `rxsoft_admin`), so the chooser
 * must sign in with that role and land on the module dashboard. The API login
 * loop covers every account without depending on each module backend being up.
 */

const IDENTITY_BASE_URL = 'http://localhost:8092';

const DEMO_USERS = {
  rxsoft: { username: 'demo_rxsoft', role: 'rxsoft_admin' },
  emr: { username: 'demo_emr', role: 'emr_admin' },
  lis: { username: 'demo_lis', role: 'lis_admin' },
  conversation: { username: 'demo_conversation', role: 'conversation_admin' },
  communication: { username: 'demo_communication', role: 'communication_admin' },
  'coding-concept': { username: 'demo_coding_concept', role: 'coding_concept_admin' },
  identity: { username: 'demo_identity', role: 'identity_admin' },
  admin: { username: 'demo_admin', role: 'admin_admin' },
  website: { username: 'demo_website', role: 'website_admin' },
} as const;

const DEMO_PASSWORD = 'password';

let identityUp = false;

function decodeJwt(token: string): { roles?: string[] } | null {
  try {
    const part = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = part.padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

test.beforeAll(async () => {
  try {
    const res = await fetch(`${IDENTITY_BASE_URL}/provision/health`, {
      signal: AbortSignal.timeout(4000),
    });
    identityUp = res.ok;
  } catch {
    identityUp = false;
  }
});

test.describe('try our platform', () => {
  test('opens the module chooser from the sign-in page', async ({ page }) => {
    test.skip(!identityUp, 'identity service is not running');

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-try-platform').click();

    await expect(page.getByTestId('try-platform-modal')).toBeVisible();
    for (const moduleId of Object.keys(DEMO_USERS)) {
      await expect(page.getByTestId(`try-platform-module-${moduleId}`)).toBeVisible();
    }
  });

  test('clicking RxSoft signs in as the module-admin demo and lands on its dashboard', async ({
    page,
  }) => {
    test.skip(!identityUp, 'identity service is not running');

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-try-platform').click();
    await page.getByTestId('try-platform-module-rxsoft').click();

    await page.waitForURL(/\/rxsoft\/dashboard$/, { timeout: 45_000 });

    const token = await page.evaluate(() =>
      window.localStorage.getItem('rxsoft_admin_access_token')
    );
    expect(token, 'demo login must persist an access token').toBeTruthy();
    const payload = decodeJwt(token!);
    expect(payload?.roles ?? [], 'demo session uses the module-admin role').toContain(
      'rxsoft_admin'
    );

    const meRes = await fetch(`${IDENTITY_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meRes.ok).toBe(true);
    const me = (await meRes.json()) as { modules: Array<{ id: string }>; permissions: string[] };
    expect(me.modules.map((module) => module.id)).toContain('rxsoft');
    expect(me.permissions, 'rxsoft admin grant is present').toContain('rxsoft');
  });

  test('clicking Prognocare EMR opens the EMR demo without a 403 redirect', async ({ page }) => {
    test.skip(!identityUp, 'identity service is not running');

    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('sign-in-try-platform').click();
    await page.getByTestId('try-platform-module-emr').click();

    await page.waitForURL(/\/emr\/dashboard$/, { timeout: 45_000 });
    await expect(page).not.toHaveURL(/\/403/);
    // The organisation switcher is super-admin-only and must not fetch
    // /organizations for a module-scoped demo user (that 403 bounced the page
    // to /403 before the guard was added).
    await expect(page.getByTestId('header-organisation-trigger')).toHaveCount(0);
  });

  test('no demo module lands on /403 after the header settles', async ({ page, context }) => {
    test.skip(!identityUp, 'identity service is not running');

    let forbidden: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 403) {
        forbidden.push(`${response.request().method()} ${response.url()}`);
      }
    });

    for (const moduleId of Object.keys(DEMO_USERS)) {
      forbidden = [];
      // Drop the previous demo session so each module starts from /sign-in.
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await context.clearCookies();
      await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });

      await page.getByTestId('sign-in-try-platform').click();
      await page.getByTestId(`try-platform-module-${moduleId}`).click();
      await page.waitForURL((url) => url.pathname === `/${moduleId}/dashboard`, {
        timeout: 45_000,
      });

      // Header widgets (organisations/locations) fetch asynchronously; give a
      // role-gated 403 time to surface so this catches the redirect regression.
      await page.waitForTimeout(2_000);
      expect(
        page.url(),
        `${moduleId} demo must not redirect to /403 (403s: ${forbidden.join(' | ')})`
      ).not.toContain('/403');
      expect(
        forbidden,
        `${moduleId} demo must not hit forbidden endpoints: ${forbidden.join(' | ')}`
      ).toEqual([]);
    }
  });

  test('every module demo account signs in with its module-admin role', async () => {
    test.skip(!identityUp, 'identity service is not running');

    for (const [moduleId, demo] of Object.entries(DEMO_USERS)) {
      const res = await fetch(`${IDENTITY_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: demo.username, password: DEMO_PASSWORD }),
      });
      expect(res.ok, `${demo.username} must be seeded in the DEFAULT organisation`).toBe(true);
      const tokens = (await res.json()) as { accessToken: string };
      const payload = decodeJwt(tokens.accessToken);
      expect(payload?.roles ?? [], `${demo.username} roles`).toContain(demo.role);

      const meRes = await fetch(`${IDENTITY_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      expect(meRes.ok).toBe(true);
      const me = (await meRes.json()) as { modules: Array<{ id: string }> };
      expect(
        me.modules.map((module) => module.id),
        `${demo.username} must expose the ${moduleId} module`
      ).toContain(moduleId);
    }
  });
});
