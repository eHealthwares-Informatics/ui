import { expect, test } from '@playwright/test';

/**
 * Sidebar provisioning marker.
 *
 * The async onboarding flow polls before signing the user in, but a session
 * opened mid-provision (another tab, manual sign-in, a resumed job) must show
 * that setup is still running. The marker polls /auth/provisioning and hides
 * itself once the job completes; a failed job offers a resume.
 *
 * The identity endpoint is mocked here so the test is deterministic (no need to
 * race a real ~15s provisioning job) and runs in the authenticated admin
 * project.
 */

const PROVISIONING_URL = '**/api/identity/auth/provisioning';
const RESUME_URL = '**/api/identity/provision/TEST/resume';

const runningState = {
  status: 'running',
  stage: 'backend-lots',
  stages: [
    { name: 'identity', status: 'completed' },
    { name: 'emr', status: 'completed' },
    { name: 'identity-access', status: 'completed' },
    { name: 'backend-items', status: 'completed' },
    { name: 'backend-lots', status: 'running' },
    { name: 'backend-balances', status: 'pending' },
  ],
  error: null,
  organizationCode: 'TEST',
};

test.describe('sidebar provisioning marker', () => {
  test('appears while the job runs and disappears when it completes', async ({ page }) => {
    let state: object = runningState;
    await page.route(PROVISIONING_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state) })
    );

    await page.goto('/rxsoft/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('sidebar-provisioning')).toBeVisible();
    await expect(page.getByTestId('sidebar-provisioning')).toContainText('Provisioning');

    state = { ...runningState, status: 'completed', stage: null };
    await expect(page.getByTestId('sidebar-provisioning')).toHaveCount(0, { timeout: 20_000 });
  });

  test('shows a paused state with Retry, and resumes the job', async ({ page }) => {
    let state: object = {
      ...runningState,
      status: 'failed',
      stage: 'backend-lots',
      error: 'Allocation failed under memory pressure',
      stages: runningState.stages.map((stage) =>
        stage.name === 'backend-lots' ? { ...stage, status: 'failed' } : stage
      ),
    };

    await page.route(PROVISIONING_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(state) })
    );
    await page.route(RESUME_URL, (route) =>
      route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ organisation: { status: 'pending' } }),
      })
    );

    await page.goto('/rxsoft/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('sidebar-provisioning')).toContainText('Provisioning paused');
    await expect(page.getByTestId('sidebar-provisioning-retry')).toBeVisible();

    // The resume endpoint returns 202; the next poll reports completed.
    state = { ...runningState, status: 'completed', stage: null };
    await page.getByTestId('sidebar-provisioning-retry').click();
    await expect(page.getByTestId('sidebar-provisioning')).toHaveCount(0, { timeout: 20_000 });
  });
});
