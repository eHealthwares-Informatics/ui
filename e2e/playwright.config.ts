import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
/** Playwright resolves `use.storageState` relative to the process CWD, so use an absolute path. */
const ADMIN_STORAGE_STATE = join(E2E_DIR, '.auth', 'admin.json');
const EMR_ADMIN_STORAGE_STATE = join(E2E_DIR, '.auth', 'emr-admin.json');

/**
 * Failure artifacts (traces, screenshots, .last-run.json) land OUTSIDE the repo
 * so the Vite dev server started by `webServer` never watches them — ui#94.
 * Playwright writes a trace/screenshot per failing test as the suite runs, and
 * any write inside a watched directory fires a full HMR page reload that kills
 * the in-flight navigation that was about to be asserted.
 *
 * Still overridable: PLAYWRIGHT_OUTPUT_DIR=./test-results npx playwright test ...
 * (note that `pathResolve` is config-dir-relative, so resolve absolute paths
 * yourself if you point it back inside the repo).
 */
const OUTPUT_DIR = process.env.PLAYWRIGHT_OUTPUT_DIR ?? join(tmpdir(), 'rxsoft-e2e-artifacts');

/**
 * Playwright config.
 *
 * Projects:
 *  - setup   : runs e2e/tests/auth.setup.ts, logs in as admin, writes e2e/.auth/admin.json
 *  - public  : no storageState -> auth, errors, root specs
 *  - admin   : admin storageState -> sign-out + /rxsoft + crud-suite + shop
 */
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 2,
  // Outside the repo root — see OUTPUT_DIR above (ui#94).
  outputDir: OUTPUT_DIR,
  reporter: [
    ['list'],
    // open: 'never' keeps CI/scripted runs from blocking on the report server.
    // The HTML report is a durable artifact developers/tracker tooling read back
    // from disk, so it stays in the repo; vite's `server.watch.ignored` excludes
    // it from the dev-server watcher instead.
    ['html', { outputFolder: 'reports', open: 'never' }],
  ],
  projects: [
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'public',
      testMatch: ['tests/auth/sign-in.spec.ts', 'tests/errors/**', 'tests/root/**'],
      testIgnore: ['**/auth.setup.ts'],
    },
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: ['tests/**', 'crud-suite/**'],
      testIgnore: [
        '**/auth.setup.ts',
        'tests/emr/**',
        'tests/auth/sign-in.spec.ts',
        'tests/root/**',
      ],
      use: {
        storageState: ADMIN_STORAGE_STATE,
      },
    },
    // EMR: fully mocked API (identity + EMR), synthetic admin session, so the
    // suite runs without any backend. See tests/emr and support/emr-mocks.ts.
    {
      name: 'emr-setup',
      testMatch: 'emr.setup.ts',
    },
    {
      name: 'emr',
      dependencies: ['emr-setup'],
      testMatch: ['tests/emr/**/*.spec.ts'],
      use: {
        storageState: EMR_ADMIN_STORAGE_STATE,
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
    actionTimeout: 60_000,
    navigationTimeout: 90_000,
  },
});
