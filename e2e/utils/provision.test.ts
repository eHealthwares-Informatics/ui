import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

/**
 * Teardown safety net for seed#12: `DELETE /api/provision/:code` can hang
 * forever, which stalled global-teardown for 28 minutes after run 4c11 had
 * already reported its results. deprovisionOrganization must give up quickly
 * with a clear error so the Playwright process always exits.
 */

const ENV_KEYS = [
  'SEED_BASE_URL',
  'SEED_DEPROVISION_TIMEOUT_MS',
  'SEED_PROVISION_API_KEY',
  'SEED_API_KEY',
] as const;

let server: Server | null = null;
let baseUrl = '';
const savedEnv: Record<string, string | undefined> = {};

function startServer(onRequest: (res: import('node:http').ServerResponse) => void): Promise<void> {
  server = createServer((_req, res) => onRequest(res));
  return new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
      resolve();
    });
  });
}

async function loadProvision(timeoutMs: number) {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }
  process.env.SEED_BASE_URL = baseUrl;
  process.env.SEED_DEPROVISION_TIMEOUT_MS = String(timeoutMs);
  process.env.SEED_PROVISION_API_KEY = '';
  process.env.SEED_API_KEY = '';
  vi.resetModules();
  return import('./provision');
}

afterEach(async () => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key]!;
    }
  }
  if (server) {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
});

describe('deprovisionOrganization (teardown hang guard)', () => {
  it('gives up on a hung seed DELETE instead of stalling teardown', async () => {
    await startServer(() => {
      /* seed#12: accept the request and never answer */
    });
    const { deprovisionOrganization } = await loadProvision(200);

    const startedAt = Date.now();
    await expect(deprovisionOrganization('E2E-HANG')).rejects.toThrow(
      /aborted after 200ms .*seed#12/
    );
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  });

  it('resolves true when the seed confirms deprovisioning', async () => {
    await startServer((res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ deprovisioned: true }));
    });
    const { deprovisionOrganization } = await loadProvision(5_000);

    await expect(deprovisionOrganization('E2E-OK')).resolves.toBe(true);
  });

  it('resolves false (never throws) on a non-2xx seed response', async () => {
    await startServer((res) => {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'unknown organisation' }));
    });
    const { deprovisionOrganization } = await loadProvision(5_000);

    await expect(deprovisionOrganization('E2E-MISSING')).resolves.toBe(false);
  });
});
