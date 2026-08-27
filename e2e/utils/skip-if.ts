import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestInfo } from '@playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HEALTH_FILE = join(__dirname, '..', '.runtime', 'backend-health.json');

interface BackendHealth {
  backendUp: boolean;
  conversationUp: boolean;
  lisUp: boolean;
  communicationUp: boolean;
  checkedAt: string;
}

const DOWN: BackendHealth = {
  backendUp: false,
  conversationUp: false,
  lisUp: false,
  communicationUp: false,
  checkedAt: '',
};

export type BackendScope = 'rxsoft' | 'conversation' | 'lis' | 'communication';

/** Loads the health snapshot written by global-setup; treats a missing file as "down". */
export function readBackendHealth(): BackendHealth {
  if (!existsSync(HEALTH_FILE)) return DOWN;
  try {
    return { ...DOWN, ...(JSON.parse(readFileSync(HEALTH_FILE, 'utf-8')) as BackendHealth) };
  } catch {
    return DOWN;
  }
}

/** Skip rule R1: a feature's module tree must exist before its specs run. */
export function skipIfModuleMissing(testInfo: TestInfo, moduleId: string): boolean {
  const { backendUp } = readBackendHealth();
  if (!backendUp) {
    testInfo.skip(true, `${moduleId}: backend is down (skipped)`);
    return true;
  }
  return false;
}

/** Skip rule R2: data-driven suites must never fail when their backend is down. */
export function skipIfBackendDown(testInfo: TestInfo, scope: BackendScope = 'rxsoft'): boolean {
  const health = readBackendHealth();
  const up =
    scope === 'rxsoft'
      ? health.backendUp
      : scope === 'conversation'
        ? health.conversationUp
        : scope === 'lis'
          ? health.lisUp
          : health.communicationUp;
  if (!up) {
    testInfo.skip(true, `${scope}: backend is down (skipped)`);
    return true;
  }
  return false;
}