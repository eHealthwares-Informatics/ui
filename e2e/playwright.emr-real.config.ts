import { defineConfig } from '@playwright/test';
import { resolveOutputDir } from './output-dir';

/**
 * Dedicated config for the EMR real-backend suite (emr-real.spec.ts).
 *
 * Differs from the main config:
 *  - NO globalSetup/globalTeardown: the rxsoft global setup provisions a
 *    full ~40k-item org on every run (minutes-long, and has OOM'd the seed
 *    process under memory pressure). emr-real provisions its own lean org
 *    (zero item whitelist) inside the spec and tears it down in afterAll.
 *  - reporters write to reports/emr-real/ so runs don't clobber the main
 *    HTML report.
 *
 * Run: npx playwright test --config e2e/playwright.emr-real.config.ts
 * Requires: identity :8092, seed :8094, EMR :8093, Vite :5173.
 */
export default defineConfig({
  testDir: '.',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 1, // single spec file with cross-test state (visit/encounter chain)
  outputDir: resolveOutputDir(),
  reporter: [['list'], ['html', { outputFolder: 'reports/emr-real', open: 'never' }]],
  projects: [
    {
      name: 'emr-real',
      testMatch: 'emr-real.spec.ts',
      use: {
        baseURL: 'http://localhost:5173',
        headless: true,
        viewport: { width: 1280, height: 800 },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        actionTimeout: 60_000,
        navigationTimeout: 90_000,
      },
    },
  ],
  webServer: {
    command: 'yarn dev --host',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
