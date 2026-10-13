import { expect, test } from '../../fixtures/test';

/**
 * Storefront SEO + PWA shell — eHealthwares-Informatics/ui#135
 * ("static SEO/PWA shell — robots, manifest, OG + JSON-LD (ui#49, 1/2)").
 * Public routes only (no auth) — runs in the `public` project.
 *
 * Covers what #135 shipped:
 *  - /robots.txt     crawl policy (index storefront, disallow operational
 *                    surfaces) + Sitemap reference
 *  - /manifest.json  PWA manifest (eHealthWares, start_url /shop,
 *                    display standalone)
 *  - index.html head meta description / theme-color / manifest link,
 *    Open Graph (og:type/site_name/title/description/image) and Twitter
 *    card tags
 *  - JSON-LD Organization structured data (parseable)
 *
 * NOTE (ui#49 part 2, tracked on the open parent issue): robots.txt
 * references /sitemap.xml but the sitemap itself ships in a later PR —
 * the sitemap assertion below is lenient until then.
 */

test.describe('Storefront SEO / PWA shell (ui#135)', () => {
  test('robots.txt serves the crawl policy for storefront vs operational surfaces', async ({
    page,
  }) => {
    const res = await page.goto('/robots.txt');
    expect(res?.status(), 'robots.txt must be served').toBe(200);

    const body = await page.locator('body').innerText();
    expect(body).toContain('User-agent: *');
    // Operational surfaces are never indexable…
    for (const path of ['/sign-in', '/admin', '/rxsoft', '/emr', '/lis', '/shop/checkout']) {
      expect(body, `robots.txt must disallow ${path}`).toContain(`Disallow: ${path}`);
    }
    // …and the sitemap is referenced (existence is ui#49 part 2).
    expect(body).toMatch(/^Sitemap: \/sitemap\.xml$/m);
  });

  test('manifest.json serves a valid PWA manifest', async ({ page }) => {
    const res = await page.goto('/manifest.json');
    expect(res?.status(), 'manifest.json must be served').toBe(200);

    const manifest = JSON.parse(await page.locator('body').innerText());
    expect(manifest.name).toBe('eHealthWares');
    expect(manifest.short_name).toBe('eHealthWares');
    expect(manifest.start_url).toBe('/shop');
    expect(manifest.display).toBe('standalone');
    expect(manifest.scope).toBe('/');
    expect(
      Array.isArray(manifest.icons) && manifest.icons.length > 0,
      'manifest must ship icons'
    ).toBe(true);
  });

  test('storefront HTML head carries the SEO meta, OG and Twitter tags (ui#135)', async ({
    page,
  }) => {
    // The SEO tags live in the shared index.html <head>, so they are
    // route-independent (unauthenticated '/' redirects to /sign-in).
    await page.goto('/');

    // Description + theme + manifest link (index.html head).
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /eHealthWares/
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#12345b');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');

    // Open Graph.
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'eHealthWares'
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      '/assets/honey_comb_logo_with_caption.png'
    );

    // Twitter card.
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image'
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(1);
  });

  test('JSON-LD Organization structured data is present and parses', async ({ page }) => {
    await page.goto('/');

    const raw = await page.locator('script[type="application/ld+json"]').first().innerText();
    expect(raw.length, 'JSON-LD script must not be empty').toBeGreaterThan(0);

    const ld = JSON.parse(raw);
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Organization');
    expect(ld.name).toBe('eHealthWares');
  });

  test('sitemap.xml — lenient until ui#49 part 2 ships it', async ({ page }) => {
    // robots.txt already points at /sitemap.xml; the file itself is part of
    // the open parent issue eHealthwares-Informatics/ui#49 (PR #135 was 1/2).
    // Pass with an annotation while it 404s; assert XML once it exists.
    const res = await page.goto('/sitemap.xml');
    if (!res || res.status() === 404) {
      test.info().annotations.push({
        type: 'known-gap',
        description: 'sitemap.xml ships with ui#49 part 2 (robots.txt already references it)',
      });
      return;
    }
    expect(res.status()).toBe(200);
    const body = await page.locator('body').innerText();
    expect(body, 'sitemap must be XML urlset/sitemapindex').toMatch(/urlset|sitemapindex/);
  });
});
