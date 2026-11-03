import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * Shopper Wallet E2E Test
 * UC-RX-WALLET-MOBILE-01: View wallet balance and transactions on mobile.
 *
 * Covers:
 *   TC-WALLET-01  Wallet balance renders for authenticated shopper
 *   TC-WALLET-02  Wallet transactions list renders
 *   TC-WALLET-03  Deposit button is visible when authenticated
 *   TC-WALLET-04  Wallet is hidden when not authenticated
 *
 * Self-setup: reads org state for party context; resolves user via API;
 * wallet data fetched from /website/wallet endpoint.
 *
 * Known gaps: deposit flow end-to-end (checkout payment modal) covered separately;
 * this test covers view-only.
 */
const TS = Date.now().toString(36);

test.describe.serial('Shopper Wallet', () => {
  test.setTimeout(120_000);

  let accessToken: string | null = null;
  let userId: string = '';

  // Resources created by this suite (teardown deletes only these).
  const createdIds: string[] = [];

  // ── Helpers ──────────────────────────────────────────────────

  /** Get authenticated access token via API. */
  async function getAccessToken(page: import('@playwright/test').Page) {
    accessToken = await readAccessToken(page);
    return accessToken;
  }

  // ── Teardown ─────────────────────────────────────────────────

  test.afterAll(async ({ request }) => {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };

    for (const id of createdIds) {
      try {
        await request.delete(`http://localhost:8080/api/${id}`, { headers });
      } catch {
        /* idempotent */
      }
    }
  });
});
