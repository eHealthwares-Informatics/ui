import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
/** Playwright resolves `use.storageState` relative to the process CWD, so use an absolute path. */
const ADMIN_STORAGE_STATE = join(E2E_DIR, '.auth', 'admin.json');

/**
 * Playwright config — Phase 1: Auth + APM website.
 *
 * Projects:
 *  - setup   : runs e2e/tests/auth.setup.ts, logs in as admin, writes e2e/.auth/admin.json
 *  - public  : no storageState -> auth, errors, root, APM website specs
 *  - admin   : admin storageState -> sign-out + future /apm/admin & /rxsoft suites
 */
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports' }],
  ],
  projects: [
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'public',
      // RxSoft CRUD/admin specs need an authenticated session, so the public
      // project only runs the public-facing suites. NOTE: do not add an
      // `**/rxsoft/**` testIgnore here — the repo root directory is literally
      // named rxsoft, so that glob swallows every file.
      testMatch: ['tests/apm/**', 'tests/auth/sign-in.spec.ts', 'tests/errors/**', 'tests/root/**'],
      testIgnore: ['**/auth.setup.ts'],
    },
    {
      name: 'admin',
      testMatch: ['tests/**', 'crud-suite/**'],
      testIgnore: ['**/auth.setup.ts'],
      use: {
        storageState: ADMIN_STORAGE_STATE,
      },
    },
  ],
  webServer: {
    command: 'yarn dev --host',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
});
