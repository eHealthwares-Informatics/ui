import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SignInPage } from '../page-objects/sign-in.page';
import { AppLayoutPage } from '../page-objects/app-layout.page';
import { skipIfModuleMissing, skipIfBackendDown, readBackendHealth } from '../utils/skip-if';
import { primeAdminSession } from '../utils/session-refresh';

export type AppFixtures = {
  signInPage: SignInPage;
  appLayout: AppLayoutPage;
};

export const test = base.extend<AppFixtures>({
  // Auto fixture: refreshes the admin access token before every test that runs
  // with the authenticated storageState, so long suites don't expire mid-run.
  // No-op for public (unauthenticated) and synthetic (mocked EMR) contexts.
  primeAdminSession: [
    async ({ page }, use) => {
      await primeAdminSession(page);
      await use();
    },
    { auto: true },
  ] as any,
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  appLayout: async ({ page }, use) => {
    await use(new AppLayoutPage(page));
  },
});

export { expect };
export type { Page };
export { skipIfModuleMissing, skipIfBackendDown, readBackendHealth };