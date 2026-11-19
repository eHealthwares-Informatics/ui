import type { ModuleId } from './module-data';

/**
 * "Try our platform" demo accounts.
 *
 * These users live in the seeded DEFAULT organisation and each holds the
 * matching module-admin role (e.g. `demo_rxsoft` → `rxsoft_admin`), so picking a
 * module signs in with a role that exposes every feature of that module while
 * reading the SAME reference/demo data as the default organisation.
 *
 * Credentials are intentionally kept in the frontend for the demo flow (a
 * shared, seeded account with a well-known password). Do not reuse these users
 * for anything privileged.
 */
export type DemoAccount = {
  username: string;
  password: string;
};

export const DEMO_PASSWORD = 'password';

export const DEMO_ACCOUNTS: Partial<Record<ModuleId, DemoAccount>> = {
  rxsoft: { username: 'demo_rxsoft', password: DEMO_PASSWORD },
  emr: { username: 'demo_emr', password: DEMO_PASSWORD },
  lis: { username: 'demo_lis', password: DEMO_PASSWORD },
  conversation: { username: 'demo_conversation', password: DEMO_PASSWORD },
  communication: { username: 'demo_communication', password: DEMO_PASSWORD },
  'coding-concept': { username: 'demo_coding_concept', password: DEMO_PASSWORD },
  identity: { username: 'demo_identity', password: DEMO_PASSWORD },
  admin: { username: 'demo_admin', password: DEMO_PASSWORD },
  website: { username: 'demo_website', password: DEMO_PASSWORD },
};

export function demoAccountFor(moduleId: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS[moduleId as ModuleId];
}
