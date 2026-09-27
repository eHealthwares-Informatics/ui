import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { provisionOrganization, SEED_BASE_URL, activeAdminCredentials } from './utils/provision';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BACKEND_HEALTH_URL = 'http://localhost:8080/api/health';
const BACKEND_API_URL = 'http://localhost:8080/api';
const IDENTITY_BASE_URL = 'http://localhost:8092';
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

interface ArtifactCheck {
  name: string;
  endpoint: string;
  /** JSONPath to the count/array — defaults to `.data.length > 0` */
  dataPath?: string;
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

/**
 * Seed artifacts that MUST be present after provisioning.
 * All are scoped to the provisioned org (token-visible resources).
 */
const SEED_ARTIFACTS: ArtifactCheck[] = [
  { name: 'Items', endpoint: '/items?limit=1' },
  { name: 'UOMs', endpoint: '/uoms?limit=1' },
  { name: 'Categories', endpoint: '/categories?limit=1' },
  { name: 'Price Lists', endpoint: '/price-lists?limit=1' },
  // Price list items live UNDER the price list (no top-level controller):
  // GET /price-lists/:priceListId/items. Resolved at runtime from the retail
  // price list id; checked below after the main loop.
  { name: 'Suppliers', endpoint: '/suppliers?limit=1' },
  { name: 'Customers', endpoint: '/customers?limit=1' },
  { name: 'Payment Methods', endpoint: '/payment-methods?limit=1' },
  // NOTE: there is no /branches controller — branch-shaped data lives in
  // identity locations (HQ + STORE provisioned). Use stock locations instead.
  { name: 'Stock Locations', endpoint: '/stock-locations?limit=1' },
  { name: 'Warehouses', endpoint: '/warehouses?limit=1' },
  // NOTE: /roles returns a BARE ARRAY (no {data} envelope) — countRows handles it.
  { name: 'Roles', endpoint: '/roles?limit=1' },
  { name: 'Organizations', endpoint: '/organizations?limit=1' },
  // GL accounts are org-scoped and provisioned per org by the seed service.
  { name: 'GL Accounts', endpoint: '/gl-accounts?limit=1' },
];

/**
 * Authenticates against identity via REST and returns a bearer token.
 * Uses the admin credentials from the provisioned org (or DEFAULT fallback).
 */
async function getIdentityToken(): Promise<string> {
  const { username, password } = activeAdminCredentials();
  const res = await fetch(`${IDENTITY_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`identity login failed (${res.status}) for user ${username}`);
  }
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

/**
 * Extracts the row count from any list response shape used by the backends:
 * {data: []}, {items: []}, {results: []}, a bare array, or {total: n}.
 */
function countRows(body: unknown): number {
  if (Array.isArray(body)) return body.length;
  if (body && typeof body === 'object') {
    const shaped = body as Record<string, unknown>;
    for (const key of ['data', 'items', 'results']) {
      if (Array.isArray(shaped[key])) return (shaped[key] as unknown[]).length;
    }
    if (typeof shaped.total === 'number') return shaped.total;
  }
  return 0;
}

/**
 * Verifies that all seed artifacts exist in the provisioned organisation.
 * Throws eagerly (fail-fast) with all missing artifacts listed in one message,
 * so CI knows exactly what seeds need investigation.
 */
async function verifySeedArtifacts(token: string): Promise<void> {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const artifact of SEED_ARTIFACTS) {
    try {
      const res = await fetch(`${BACKEND_API_URL}${artifact.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        errors.push(`${artifact.name} — HTTP ${res.status}`);
        continue;
      }
      const count = countRows(await res.json());
      if (count === 0) {
        missing.push(artifact.name);
      }
    } catch (err) {
      errors.push(`${artifact.name} — ${(err as Error).message}`);
    }
  }

  // Price list items are nested under the retail price list:
  // GET /price-lists/:id/items (no top-level /price-list-items controller).
  try {
    const plRes = await fetch(`${BACKEND_API_URL}/price-lists?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!plRes.ok) {
      errors.push(`Price List Items — cannot resolve price list (HTTP ${plRes.status})`);
    } else {
      const plBody = (await plRes.json()) as unknown;
      const first = Array.isArray(plBody)
        ? (plBody[0] as { id?: string } | undefined)
        : ((plBody as { data?: Array<{ id?: string }> }).data?.[0] ?? undefined);
      if (!first?.id) {
        missing.push('Price List Items (no price list found to check under)');
      } else {
        const pliRes = await fetch(`${BACKEND_API_URL}/price-lists/${first.id}/items?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!pliRes.ok) {
          errors.push(`Price List Items — HTTP ${pliRes.status}`);
        } else if (countRows(await pliRes.json()) === 0) {
          missing.push('Price List Items');
        }
      }
    }
  } catch (err) {
    errors.push(`Price List Items — ${(err as Error).message}`);
  }

  if (missing.length > 0 || errors.length > 0) {
    const parts: string[] = [];
    if (missing.length > 0) {
      parts.push(`❌ SEED ARTIFACTS MISSING (0 records found):\n  ${missing.join('\n  ')}`);
    }
    if (errors.length > 0) {
      parts.push(`⚠️  ARTIFACT CHECKS FAILED:\n  ${errors.join('\n  ')}`);
    }
    throw new Error(
      `[global-setup] Eager artifact validation failed — aborting test run.\n\n${parts.join('\n\n')}\n\n` +
        `Fix: ensure the seed service provisions all required reference data, or check backend health.`
    );
  }

  // eslint-disable-next-line no-console
  console.log(`[global-setup] ✅ All ${SEED_ARTIFACTS.length} seed artifacts verified — ${SEED_ARTIFACTS.length} found`);
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
  // every suite (auth, rxsoft, crud, shop) executes against an isolated
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

  // ─── Eager artifact validation ─────────────────────────────────────
  // When the backend is up AND the org was provisioned, verify that the
  // seeded reference data actually made it into the database. Fail fast
  // with a full report of what's missing — don't let tests discover this
  // one-by-one in the middle of a suite.
  if (backendUp && orgProvisioned) {
    try {
      const token = await getIdentityToken();
      await verifySeedArtifacts(token);
    } catch (err) {
      // Log the complaint clearly, then re-throw to hard-fail the run.
      const msg = (err as Error).message;
      // eslint-disable-next-line no-console
      console.error(`\n⚠️  ${msg}\n`);
      throw err;
    }
  } else if (backendUp && !orgProvisioned) {
    // eslint-disable-next-line no-console
    console.warn('[global-setup] ⚠️  Backend is up but org was NOT provisioned — artifact validation skipped. ' +
      'Tests will use DEFAULT org admin (may fail if seeded data not found).');
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