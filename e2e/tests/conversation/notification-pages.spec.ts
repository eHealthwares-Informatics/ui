import { expect, test } from '../../fixtures/test';
import { skipIfBackendDown } from '../../utils/skip-if';

/**
 * Conversation notification pages (conversationApi, backend :8090).
 *
 * These pages were moved off the old notification-specific endpoints:
 *  - channels          -> `/channels`            (unified channel registry)
 *  - templates         -> `/notification-templates`
 *  - events            -> `/notification-events` (+ print templates from `/templates?type=print`)
 *  - delivery          -> `/notification-deliveries`
 *  - `/conversation/notification-channels` was removed entirely.
 */
const pages = [
  { path: '/conversation/channels', title: 'Channels' },
  { path: '/conversation/notification-templates', title: 'Notification Templates' },
  { path: '/conversation/notification-events', title: 'Notification Events' },
  { path: '/conversation/notification-delivery', title: 'Notification Delivery' },
];

function selectConversationModule() {
  localStorage.setItem('rxsoft_admin_selected_module', 'conversation');
}

for (const entry of pages) {
  test(`${entry.path} renders the conversation notification page`, async ({ page }, testInfo) => {
    if (skipIfBackendDown(testInfo, 'conversation')) return;

    // Direct deep links from a non-conversation module are redirected to the
    // module dashboard by the shell; start in the conversation module.
    await page.addInitScript(selectConversationModule);
    await page.goto(entry.path);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(new RegExp(`${entry.path}/?$`));
    await expect(page.getByText('Whoops!')).toHaveCount(0);

    // Org admins see the page title directly; superadmins see the org picker.
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: entry.title })
        .or(page.getByText('Select an organisation')),
    ).toBeVisible({ timeout: 30_000 });
  });
}

test('channels page loads the unified /channels registry', async ({ page }, testInfo) => {
  if (skipIfBackendDown(testInfo, 'conversation')) return;

  const channelRequests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && /\/conversation\/channels$/.test(url.pathname)) {
      channelRequests.push(url);
    }
  });

  await page.addInitScript(selectConversationModule);
  await page.goto('/conversation/channels');
  await page.waitForLoadState('domcontentloaded');

  await expect
    .poll(() => channelRequests.length, { timeout: 30_000 })
    .toBeGreaterThan(0);
  // The removed notification-specific endpoint must not be used anymore.
  expect(channelRequests.some((url) => url.pathname.endsWith('/notification-channels'))).toBe(
    false,
  );
});

test('the removed notification-channels page no longer renders', async ({ page }, testInfo) => {
  if (skipIfBackendDown(testInfo, 'conversation')) return;

  await page.addInitScript(selectConversationModule);
  await page.goto('/conversation/notification-channels');
  await page.waitForLoadState('domcontentloaded');

  // The old page renderer is gone: no "Channels Config" heading is mounted.
  await expect(page.getByTestId('page-title').filter({ hasText: 'Channels Config' })).toHaveCount(
    0,
  );
  await expect(page.getByText('Channels Config')).toHaveCount(0);
});

test('notification events picker requests only print templates and surfaces just those', async ({
  page,
}, testInfo) => {
  if (skipIfBackendDown(testInfo, 'conversation')) return;

  await page.addInitScript(() => {
    localStorage.setItem('rxsoft_admin_selected_module', 'conversation');
    // Force the card view, which renders the per-event print-template picker.
    localStorage.setItem('notification-events-view', 'cards');
  });

  const printRequests: URL[] = [];
  await page.route('**/templates?**', async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith('/templates') || url.searchParams.get('type') !== 'print') {
      await route.continue();
      return;
    }

    printRequests.push(url);
    // Deliberately mix a notification template into the payload: the page must
    // defensively drop it, so only print templates reach the dropdown.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'pt-1', type: 'print', code: 'PRINT_A', name: 'Print A', isActive: true },
          { id: 'pt-2', type: 'print', code: 'PRINT_B', name: 'Print B', isActive: true },
          {
            id: 'nt-1',
            type: 'notification',
            code: 'APPOINTMENT',
            name: 'Notification X',
            isActive: true,
          },
        ],
        meta: { page: 1, limit: 200, total: 3 },
      }),
    });
  });

  await page.goto('/conversation/notification-events');
  await page.waitForLoadState('domcontentloaded');

  await expect.poll(() => printRequests.length, { timeout: 30_000 }).toBeGreaterThan(0);
  const request = printRequests[0];
  expect(request.searchParams.get('type')).toBe('print');
  expect(request.searchParams.get('isActive')).toBe('true');
  expect(request.searchParams.get('limit')).toBe('200');

  const picker = page.getByTestId(/^notification-event-print-template-/).first();
  await expect(picker).toBeVisible({ timeout: 30_000 });
  await picker.click();

  await expect(page.getByRole('option', { name: 'Print A (PRINT_A)' })).toBeVisible();
  await expect(page.getByRole('option', { name: 'Print B (PRINT_B)' })).toBeVisible();
  await expect(page.getByRole('option', { name: /Notification X/ })).toHaveCount(0);
});
