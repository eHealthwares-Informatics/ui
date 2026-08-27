import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup } from '@playwright/test';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
export const EMR_ADMIN_STORAGE_STATE = join(E2E_DIR, '.auth', 'emr-admin.json');

function base64Url(input: string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Synthetic JWT the app's client-side decoder accepts (sub + username + exp). */
export function makeAccessToken(): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      sub: 'user-1',
      username: 'admin',
      email: 'admin@ehealthwares.com',
      roles: ['doctor', 'super_admin'],
      permissions: [],
      organizationId: 'org-1',
      locationId: 'loc-1',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );
  return `${header}.${payload}.test-signature`;
}

setup('create synthetic EMR admin session', async ({ page }) => {
  await page.goto('/sign-in');
  await page.evaluate((accessToken) => {
    localStorage.setItem('rxsoft_admin_access_token', accessToken);
    localStorage.setItem('rxsoft_admin_refresh_token', `${accessToken}.refresh`);
  }, makeAccessToken());
  await page.context().storageState({ path: EMR_ADMIN_STORAGE_STATE });
});
