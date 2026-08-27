import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
export const ORG_STATE_PATH = join(E2E_DIR, '..', '.runtime', 'org-state.json');

export const SEED_BASE_URL = (process.env.SEED_BASE_URL ?? 'http://localhost:8093').replace(/\/$/, '');
export const SEED_API_KEY = process.env.SEED_PROVISION_API_KEY ?? process.env.SEED_API_KEY ?? '';

export type OrgState = {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  priceList: { id: string; code: string; name: string };
  stockLocations: {
    sale: { id: string; code: string; name: string };
    main: { id: string; code: string; name: string };
    returnLocation: { id: string; code: string; name: string };
  };
  warehouses: Array<{ id: string; code: string; name: string }>;
  parties: Array<{ id: string; code: string; partyType: string; name: string }>;
  whitelistedItemCodes: string[];
  users: Array<{
    username: string;
    password: string;
    roles: string[];
    organizationId: string;
    locationId: string | null;
  }>;
  created: boolean;
  provisionedAt: string;
};

type ProvisionOrgInput = {
  code: string;
  name: string;
  password?: string;
  ownerUsername?: string;
  template?: string;
  items?: string[];
};

/**
 * Provisions a fresh organisation in the seed service (POST /api/provision).
 * Creates the org + roles + users in identity and the reference data (item
 * whitelist, retail price list, stock, parties, POS configs) in rxsoft.
 */
export async function provisionOrganization(input: ProvisionOrgInput): Promise<OrgState> {
  const res = await fetch(`${SEED_BASE_URL}/api/provision`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(SEED_API_KEY ? { 'x-api-key': SEED_API_KEY } : {}),
    },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`provisioning failed (${res.status}): ${JSON.stringify(body)}`);
  }
  const org = body.organisation as OrgState;
  org.provisionedAt = new Date().toISOString();
  mkdirSync(dirname(ORG_STATE_PATH), { recursive: true });
  writeFileSync(ORG_STATE_PATH, JSON.stringify(org, null, 2), 'utf-8');
  return org;
}

/**
 * Tears down the provisioned organisation (DELETE /api/provision/:code).
 * Idempotent — safe to call more than once.
 */
export async function deprovisionOrganization(code: string): Promise<boolean> {
  const res = await fetch(`${SEED_BASE_URL}/api/provision/${encodeURIComponent(code)}`, {
    method: 'DELETE',
    headers: SEED_API_KEY ? { 'x-api-key': SEED_API_KEY } : {},
  });
  if (!res.ok) {
    return false;
  }
  const body = (await res.json().catch(() => ({}))) as { deprovisioned?: boolean };
  return body.deprovisioned ?? false;
}

/** Reads the current run's org state, or null when it wasn't provisioned. */
export function readOrgState(): OrgState | null {
  try {
    return JSON.parse(readFileSync(ORG_STATE_PATH, 'utf-8')) as OrgState;
  } catch {
    return null;
  }
}

/**
 * Credentials the suite signs in with: the freshly provisioned org owner, or
 * the DEFAULT org admin when provisioning wasn't possible (seed/identity down
 * in local dev, or running only the mocked EMR/public projects).
 */
export function activeAdminCredentials(): { username: string; password: string } {
  const org = readOrgState();
  const owner =
    org?.users.find((u) => u.roles.includes('admin')) ??
    org?.users.find((u) => u.roles.length > 0) ??
    org?.users[0];
  if (owner) {
    return { username: owner.username, password: owner.password };
  }
  return { username: process.env.E2E_FALLBACK_USERNAME ?? 'admin', password: process.env.E2E_FALLBACK_PASSWORD ?? 'password' };
}