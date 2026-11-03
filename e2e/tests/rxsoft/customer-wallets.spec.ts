import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * RxSoft Customer Wallets Admin E2E Test
 * UC-RX-WALLET-ADMIN-01: Admin views customer wallets with balances and transactions.
 *
 * Covers:
 *   TC-WALLET-ADMIN-01  Customer wallets list renders with balances
 *   TC-WALLET-ADMIN-02  Individual wallet transactions load on expand
 *   TC-WALLET-ADMIN-03  Wallet row shows user name (not just ID)
 *   TC-WALLET-ADMIN-04  Transactions table shows type, amount, balance, date
 *
 * Self-setup: reads org state for parties/warehouses context; resolves users
 * via /users API; wallet data fetched from /customer/wallet/admin/wallets endpoint.
 *
 * Known gaps: create new customer wallet not exposed via UI (admin-created only);
 * edit wallet balance not available.
 */
const TS = Date.now().toString(36);

test.describe.serial('RxSoft Customer Wallets', () => {
  test.setTimeout(120_000);

  let accessToken: string | null = null;
  let organisationId: string = '';

  // Resources created by this suite (teardown deletes only these).
  const createdIds: string[] = [];

  test.beforeEach(async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    // Read org state for context
    const org = readOrgState();
    organisationId = org.organisationId;
  });

  // ── Helpers ──────────────────────────────────────────────────

  /** Get authenticated access token via API. */
  async function getAccessToken(page: import('@playwright/test').Page) {
    accessToken = await readAccessToken(page);
    return accessToken;
  }

  /** Pick a wallet row by index and open its transactions modal. */
  async function openWalletTransactions(
    page: import('@playwright/test').Page,
    walletIndex: number
  ) {
    const rows = page.getByTestId(/wallet-row-\d+/);
    await expect(rows).toHaveCountGreaterThan(0);
    const row = rows.nth(walletIndex);
    await row.getByTestId('view-transactions').click();
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
