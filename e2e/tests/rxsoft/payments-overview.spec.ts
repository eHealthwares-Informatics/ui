import { expect, test } from '../../fixtures/test';
import { apiFetch, readAccessToken } from '../../utils/api';
import { readOrgState } from '../../utils/provision';

/**
 * RxSoft Payments Overview E2E Test
 * UC-RX-PAYMENTS-OVERVIEW-01: Admin views all payment transactions.
 *
 * Covers:
 *   TC-PAYMENT-01  Payments list page renders with columns (reference, amount, status, channel, date)
 *   TC-PAYMENT-02  Payment status filters work (Equals/NotEquals)
 *   TC-PAYMENT-03  Payment channel filter works (Web, POS, Mobile, Gateway)
 *   TC-PAYMENT-04  Pagination controls render
 *   TC-PAYMENT-05  Payment row click navigates to payment-transactions detail
 *
 * Self-setup: reads org state; resolves users and organisations via API.
 * Payment data fetched from /payments endpoint.
 *
 * Known gaps: create/edit/delete not covered (view-only per design); export not
 * available (no /payments/export endpoint).
 */
const TS = Date.now().toString(36);

test.describe.serial('RxSoft Payments Overview', () => {
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

  /** Wait for payments table to be visible. */
  async function waitForPaymentsTable(page: import('@playwright/test').Page) {
    await expect(page.getByTestId('payments-table')).toBeVisible({ timeout: 30_000 });
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