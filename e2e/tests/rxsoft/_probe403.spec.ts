import { test } from '../../fixtures/test';
test('probe403', async ({ page }) => {
  page.on('response', (r) => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
  await page.goto('/rxsoft/items', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  console.log('final URL:', page.url());
});
