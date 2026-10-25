const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  // Session present in the persisted zustand store, but the dedicated token
  // storage is empty (simulates a new tab / cleared token store).
  await page.evaluate(() => {
    localStorage.removeItem('rxsoft_admin_access_token');
    localStorage.removeItem('rxsoft_admin_refresh_token');
    sessionStorage.removeItem('rxsoft_admin_access_token');
    sessionStorage.removeItem('rxsoft_admin_refresh_token');
    localStorage.setItem('rxsoft-website-auth', JSON.stringify({
      state: {
        user: { id: 'u1', username: 'test', email: '', phone: '08030000000', roles: [] },
        accessToken: 'header.payload.sig',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
      }, version: 0,
    }));
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const tokens = await page.evaluate(() => ({
    access: localStorage.getItem('rxsoft_admin_access_token') || sessionStorage.getItem('rxsoft_admin_access_token'),
    refresh: localStorage.getItem('rxsoft_admin_refresh_token') || sessionStorage.getItem('rxsoft_admin_refresh_token'),
  }));
  console.log('restored tokens:', tokens);

  // And confirm requests now carry the bearer header.
  const seen = [];
  await ctx.route('**/api/website/settings', async (route) => {
    seen.push(route.request().headers()['authorization'] ?? '(none)');
    await route.continue();
  });
  await page.goto('http://localhost:5173/shop/checkout', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  console.log('authorization header on API call:', seen[0] ?? '(no call seen)');
  await browser.close();
})();
