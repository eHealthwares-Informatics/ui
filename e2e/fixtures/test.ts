import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { SignInPage } from '../page-objects/sign-in.page';
import { AppLayoutPage } from '../page-objects/app-layout.page';
import { skipIfModuleMissing, skipIfBackendDown, readBackendHealth } from '../utils/skip-if';

export type AppFixtures = {
  signInPage: SignInPage;
  appLayout: AppLayoutPage;
};

export const test = base.extend<AppFixtures>({
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