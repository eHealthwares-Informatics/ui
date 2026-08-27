import { expect, test } from '../../fixtures/test';
import { skipIfBackendDown } from '../../utils/skip-if';

/**
 * Conversation module (backend :8090, conversationApi). Page-render smokes for
 * its DataPageShell-style resource pages.
 */
test.describe('Conversation module', () => {
  const routes: Array<[string, string]> = [
    ['/conversation/participants', 'Participants'],
    ['/conversation/channels', 'Channels'],
    ['/conversation/questionnaires', 'Questionnaires'],
  ];

  for (const [route, heading] of routes) {
    test(`renders ${route}`, async ({ page }, testInfo) => {
      skipIfBackendDown(testInfo, 'conversation');
      await page.goto(route);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});