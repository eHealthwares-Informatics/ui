import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { provisionOrganization, SEED_BASE_URL } from './utils/provision';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BACKEND_HEALTH_URL = 'http://localhost:8080/api/health';
const CONVERSATION_HEALTH_URL = 'http://localhost:8090/api/health';
const LIS_HEALTH_URL = 'http://localhost:8002/health';
const COMMUNICATION_HEALTH_URL = 'http://localhost:8003/api/v1/health';
const SEED_HEALTH_URL = `${SEED_BASE_URL}/api/imports/health`;

interface BackendHealth {
  backendUp: boolean;
  conversationUp: boolean;
  lisUp: boolean;
  communicationUp: boolean;
  seedUp: boolean;
  orgProvisioned: boolean;
  orgCode: string | null;
  checkedAt: string;
}

function toJSON(filename: string, data: unknown): void {
  writeFileSync(join(__dirname, filename), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Probes a URL and returns true when the response is 2xx/3xx.
 * A timeout (default 5s) is treated as "down" — the APM endpoints hang
 * indefinitely when MongoDB is not running, so we must never wait forever.
 */
async function probe(url: string, timeoutMs = 5_000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export default async function globalSetup(): Promise<void> {
  const [backendUp, conversationUp, lisUp, communicationUp, seedUp] = await Promise.all([
    probe(BACKEND_HEALTH_URL),
    probe(CONVERSATION_HEALTH_URL),
    probe(LIS_HEALTH_URL),
    probe(COMMUNICATION_HEALTH_URL),
    probe(SEED_HEALTH_URL),
  ]);

  // Fresh organisation per run: request it from the seed provisioning module so
  // every suite (auth, rxsoft, crud, damorex) executes against an isolated
  // tenant with the same reference data (items, price list, stock, parties,
  // roles/users). Falls back to the DEFAULT org admin when provisioning is
  // unavailable (seed service down / only running the mocked EMR project).
  let orgCode: string | null = null;
  let orgProvisioned = false;
  if (backendUp && seedUp) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/[-:]/g, '');
    orgCode = `E2E-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    try {
      await provisionOrganization({
        code: orgCode,
        name: `E2E ${stamp} ${Date.now().toString(36)}`,
        template: 'playwright',
      });
      orgProvisioned = true;
    } catch (err) {
      // Never fail the run on provisioning (fall back to DEFAULT org admin);
      // DEBUG log so CI can spot provisioning errors.
      // eslint-disable-next-line no-console
      console.warn(`[global-setup] provisioning ${orgCode} failed — using DEFAULT org admin: ${(err as Error).message}`);
      orgCode = null;
    }
  }

  mkdirSync(join(__dirname, '.runtime'), { recursive: true });
  const health: BackendHealth = {
    backendUp,
    conversationUp,
    lisUp,
    communicationUp,
    seedUp,
    orgProvisioned,
    orgCode,
    checkedAt: new Date().toISOString(),
  };
  toJSON('.runtime/backend-health.json', health);
}