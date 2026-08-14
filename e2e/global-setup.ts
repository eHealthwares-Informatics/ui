import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BACKEND_HEALTH_URL = 'http://localhost:8080/api/health';
const APM_HOMEPAGE_URL = 'http://localhost:8080/api/apm/homepage';

interface BackendHealth {
  backendUp: boolean;
  apmUp: boolean;
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
  const backendUp = await probe(BACKEND_HEALTH_URL);
  const apmUp = await probe(APM_HOMEPAGE_URL);

  const health: BackendHealth = {
    backendUp,
    apmUp,
    checkedAt: new Date().toISOString(),
  };

  mkdirSync(join(__dirname, '.runtime'), { recursive: true });
  toJSON('.runtime/backend-health.json', health);
}