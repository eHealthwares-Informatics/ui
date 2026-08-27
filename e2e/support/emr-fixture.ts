import { test as base } from '@playwright/test';

/**
 * Shared test fixture for EMR specs. baseURL, storageState and webServer are
 * configured in playwright.config.ts; the API mocks are installed per-test via
 * installEmrMocks() (must run before page.goto()).
 */
export const test = base;
