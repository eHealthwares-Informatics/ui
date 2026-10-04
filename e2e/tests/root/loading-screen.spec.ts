import { expect, test } from '../../fixtures/test';

test.describe('loading screen (PR #16)', () => {
  // Public project: fresh unauthenticated load. The loader lives in index.html
  // and must (a) be visible immediately, (b) be removed from the DOM within
  // the ~6.4s worst-case budget (6s hard cap + 0.4s fade) — 7.5s asserted with
  // slack, and (c) leave no loader styling behind on <body>.

  // TC-LOAD-01 — loader visible on fresh load, then removed within ~7.5s.
  test('TC-LOAD-01 — loader visible on fresh load, removed within 7.5s', async ({ page }) => {
    // 'commit' returns as soon as the navigation starts; the loader is static
    // HTML so it must appear as soon as the parser creates it — waiting for
    // 'load'/'domcontentloaded' would eat into the visibility window.
    await page.goto('/', { waitUntil: 'commit' });

    const loader = page.locator('#rxsoft-loader');
    await expect(loader).toBeVisible({ timeout: 5_000 });

    const startedAt = Date.now();
    await expect(loader).toHaveCount(0, { timeout: 8_000 });
    const elapsed = Date.now() - startedAt;
    // 6s hard cap + 0.4s fade = 6.4s worst case; allow up to 7.5s of slack.
    expect(elapsed).toBeLessThan(7_500);

    // Once gone it must stay gone (idempotent fade, no re-mount).
    await page.waitForTimeout(500);
    await expect(loader).toHaveCount(0);
  });

  // TC-LOAD-02 — post-removal body is neutral (no gradient/grid/font leakage).
  test('TC-LOAD-02 — body has no loader styles after removal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'commit' });
    const loader = page.locator('#rxsoft-loader');
    await expect(loader).toHaveCount(0, { timeout: 8_000 });

    const bodyStyles = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        backgroundImage: cs.backgroundImage,
        display: cs.display,
        color: cs.color,
      };
    });

    // The loader's signature radial gradients must not leak into the app.
    expect(bodyStyles.backgroundImage).not.toContain('radial-gradient');
    // The loader used display:grid + place-items:center to center its card.
    expect(bodyStyles.display).not.toBe('grid');
    // The loader's navy text color must not persist on body.
    expect(bodyStyles.color).not.toBe('rgb(18, 52, 91)');
  });

  // TC-LOAD-03 — overlay covers the viewport on <420px screens.
  test('TC-LOAD-03 — overlay covers viewport below 420px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'commit' });

    const loader = page.locator('#rxsoft-loader');
    await expect(loader).toBeVisible({ timeout: 5_000 });

    const box = await loader.boundingBox();
    expect(box).not.toBeNull();
    // position:fixed + inset:0 — the overlay must span the full viewport.
    expect(box!.width).toBe(375);
    expect(box!.height).toBe(667);

    await expect(loader).toHaveCount(0, { timeout: 8_000 });
  });

  // TC-LOAD-04 — overlay covers the viewport on <650px screens.
  test('TC-LOAD-04 — overlay covers viewport below 650px', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('/', { waitUntil: 'commit' });

    const loader = page.locator('#rxsoft-loader');
    await expect(loader).toBeVisible({ timeout: 5_000 });

    const box = await loader.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(600);
    expect(box!.height).toBe(800);

    await expect(loader).toHaveCount(0, { timeout: 8_000 });
  });
});
