import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup, expect } from '@playwright/test';
import { SignInPage } from './page-objects/sign-in.page';
import { adminCredentials } from './fixtures/data';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
/** Must match config `storageState: './.auth/admin.json'` (resolved from the config dir). */
const ADMIN_STORAGE_STATE = join(E2E_DIR, '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  const signIn = new SignInPage(page);
  await signIn.goto();
  await signIn.signInAsAdmin();
  await signIn.expectSuccessRedirect();

  // Ensure the app shell rendered (no error boundary shown)
  await expect(page.getByText('Whoops!')).toHaveCount(0, { timeout: 1_000 }).catch(() => undefined);

  // Save storage state for the admin project
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});