import { activeAdminCredentials } from '../utils/provision';

/**
 * Credentials the suite signs in with. When global-setup provisioned a fresh
 * organisation, this is that org's owner (role `admin`); otherwise it falls
 * back to the DEFAULT org admin. Re-evaluated on every call so the value stays
 * correct regardless of module load order across workers.
 */
export function adminCredentials(): { username: string; password: string } {
  return activeAdminCredentials();
}

/** Module id -> authenticated root path (used for redirect assertions). */
export const moduleRoots: Readonly<Record<string, string>> = {
  rxsoft: '/rxsoft/items',
  conversation: '/conversation',
  'coding-concept': '/coding-concept',
  communication: '/communication',
  lis: '/lis',
  emr: '/emr',
  admin: '/rxsoft/items',
};