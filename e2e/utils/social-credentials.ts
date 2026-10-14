/**
 * Loader for the git-ignored `e2e/.env.credentials` file that stores the
 * real-credential identities used by the social OAuth e2e suite.
 *
 * The file is owned by the product owner and is never committed, logged or
 * printed. When it is absent the social specs SKIP with an explicit message
 * (documented feature gate), they never fail the suite.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E_DIR = dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_FILE = join(E2E_DIR, '..', '.env.credentials');

export type SocialCredentials = {
  google: { email: string; password: string };
  facebook: { email: string; password: string };
};

function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

export function socialCredentials(): SocialCredentials | null {
  let file: string;
  try {
    file = readFileSync(CREDENTIALS_FILE, 'utf8');
  } catch {
    return null;
  }
  const env = parseEnvFile(file);
  const google = {
    email: env.E2E_GOOGLE_EMAIL ?? '',
    password: env.E2E_GOOGLE_PASSWORD ?? '',
  };
  const facebook = {
    email: env.E2E_FACEBOOK_EMAIL ?? '',
    password: env.E2E_FACEBOOK_PASSWORD ?? '',
  };
  if (!google.email || !google.password) return null;
  return { google, facebook: facebook.email ? facebook : google };
}

/** Human-safe reason for a skip (never echoes credential values). */
export function socialSkipMessage(): string {
  return 'Real-credential social e2e requires e2e/.env.credentials with E2E_GOOGLE_EMAIL/E2E_GOOGLE_PASSWORD. Provide the file to run the live provider flows.';
}
