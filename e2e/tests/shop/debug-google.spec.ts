/** TEMP debug spec: what happens on the Google button click. Delete after use. */
import { test } from '@playwright/test';

test.use({ headless: false });

test('debug google popup', async ({ page, context }) => {
  const logs: string[] = [];
  page.on('console', (m) => logs.push(`[console:${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) =>
    logs.push(`[requestfailed] ${r.failure()?.errorText} ${r.url().slice(0, 140)}`)
  );
  page.on('response', (r) => {
    if (r.status() >= 400) {
      logs.push(`[http${r.status()}] ${r.request().method()} ${r.url().slice(0, 140)}`);
    }
  });
  context.on('page', (p) => {
    logs.push(`[popup opened] ${p.url()}`);
    p.on('console', (m) => logs.push(`[popup console:${m.type()}] ${m.text()}`));
    p.on('pageerror', (e) => logs.push(`[popup pageerror] ${e.message}`));
  });

  await page.goto('http://localhost:5173/shop/shop');
  await page.waitForLoadState('networkidle');
  await page
    .evaluate(() => import('/src/lib/social-auth.ts').catch(() => undefined))
    .catch(() => undefined);

  const authTrigger = page.getByRole('button', { name: /sign in|account|login/i }).first();
  await authTrigger.click();

  const googleBtn = page.getByRole('button', { name: /^google|continue with google/i }).first();
  await googleBtn.waitFor({ timeout: 15_000 });
  logs.push(`google button count=${await page.getByRole('button', { name: /google/i }).count()}`);
  await googleBtn.click();
  logs.push('[clicked google]');

  await page.waitForTimeout(12_000);
  const toasts = await page
    .locator('div')
    .evaluateAll((els) =>
      els
        .filter((e) => /google|sign-in|popup|consent/i.test(e.textContent ?? ''))
        .map((e) => (e.textContent ?? '').slice(0, 120))
        .slice(0, 6)
    )
    .catch(() => []);
  logs.push(`[toasts] ${JSON.stringify(toasts)}`);
  const gsilog = await page.evaluate(() => {
    const w = window as unknown as { __gsiErr?: unknown[] };
    return JSON.stringify(w.__gsiErr ?? null);
  });
  logs.push(`[gsiErr] ${gsilog}`);

  const gsi = await page.evaluate(() => {
    const w = window as unknown as { google?: { accounts?: unknown } };
    return {
      hasGoogle: !!w.google,
      hasAccounts: !!w.google?.accounts,
      hasScript: !!document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),
    };
  });
  logs.push(`[state] ${JSON.stringify(gsi)}`);

  for (const l of logs) console.log(l);
}, 120_000);
