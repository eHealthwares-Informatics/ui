import { expect, test } from '@playwright/test';

const pages = [
  { path: '/conversation/notification-channels', title: 'Channels Config' },
  { path: '/conversation/notification-templates', title: 'Notification Templates' },
  { path: '/conversation/notification-events', title: 'Notification Events' },
  { path: '/conversation/notification-delivery', title: 'Notification Delivery' },
];

for (const entry of pages) {
  test(`${entry.path} renders the conversation notification page`, async ({ page }) => {
    // Direct deep links from a non-conversation module are redirected to the
    // module dashboard by the shell; start in the conversation module.
    await page.addInitScript(() => {
      localStorage.setItem('rxsoft_admin_selected_module', 'conversation');
    });
    await page.goto(entry.path);
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(new RegExp(`${entry.path}/?$`));
    await expect(page.getByText('Whoops!')).toHaveCount(0);

    // Org admins see the page title directly; superadmins see the org picker.
    await expect(
      page
        .getByTestId('page-title')
        .filter({ hasText: entry.title })
        .or(page.getByText('Select an organisation'))
    ).toBeVisible({ timeout: 30_000 });
  });
}
