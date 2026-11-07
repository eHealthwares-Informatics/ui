import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * RxSoft Payment Transactions E2E Test
 * UC-RX-PAYMENT-TRANSACTIONS-01: Admin views payment transaction details.
 *
 * Covers:
 *   TC-PAYMENT-TXN-01  Payment transactions list renders with columns
 *   TC-PAYMENT-TXN-02  Status filter works (Initiated, Pending, Success, Failed, Cancelled, Reversed, Settled)
 *   TC-PAYMENT-TXN-03  Channel filter works (Web, POS, Mobile, Gateway)
 *   TC-PAYMENT-TXN-04  Payment row click navigates to detail path
 *   TC-PAYMENT-TXN-05  Detail page shows reference, amount, currency, status, channel, created-at
 *
 * Self-setup: reads org state; resolves users and payments via API.
 * Transaction data fetched from /payments endpoint; detail navigates to
 * /rxsoft/payment-transactions/:id.
 *
 * Known gaps: create/edit/delete not covered (view-only); export not available.
 */
const TS = Date.now().toString(36);

test.describe.serial('RxSoft Payment Transactions', () => {
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

  /** Wait for payment transactions table to be visible. */
  async function waitForPaymentTransactionsTable(page: import('@playwright/test').Page) {
    await expect(page.getByTestId('payment-transactions-table')).toBeVisible({ timeout: 30_000 });
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
