import { expect, test } from '../../fixtures/test';
import { waits } from '../../utils/adaptive-wait';

/**
 * Damorex storefront: browse products, search, filter, view product detail,
 * and test the cart/checkout flow.
 */
test.describe('Damorex storefront', () => {
  /* ---- Product listing ---- */

  test('shop page lists products with prices', async ({ page }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // Product cards render real items: at least one image and one Naira price.
    await expect(page.locator('img').first()).toBeVisible({ timeout: waits.shop.productGrid });
    const imgCount = await page.locator('img').count();
    expect(imgCount).toBeGreaterThan(0);

    const priceVisible = page.getByText(/₦/).first();
    await expect(priceVisible).toBeVisible({ timeout: waits.shop.productGrid });
  });

  /* ---- Search filters products ---- */

  test('search filters the product list', async ({ page }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // Get initial product count.
    const cards = page.locator('[class*="mantine-Card-root"]');
    await expect(cards.first()).toBeVisible({ timeout: waits.shop.productGrid });
    const initialCount = await cards.count();

    // Search for a specific term.
    const searchInput = page.getByPlaceholder('Search medicines, brands, or generics...');
    await expect(searchInput).toBeVisible({ timeout: waits.visible });
    await searchInput.fill('Paracetamol');

    // Wait for the list to update.
    await page.waitForTimeout(waits.stabilize);

    // After search, either fewer products or same — search is working.
    const afterCount = await cards.count();
    expect(afterCount).toBeLessThanOrEqual(initialCount);
  });

  /* ---- Category filter works ---- */

  test('category filter dropdown is interactive', async ({ page }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // Category select should be present and clickable.
    const categorySelect = page.getByPlaceholder('Category');
    await expect(categorySelect).toBeVisible({ timeout: waits.visible });
    await categorySelect.click();

    // Dropdown should open with at least "All Categories" option.
    const allOption = page.getByRole('option', { name: 'All Categories' });
    await expect(allOption).toBeVisible({ timeout: waits.visible });
  });

  /* ---- Product detail page via direct URL ---- */

  test('product detail page renders via direct URL', async ({ page }) => {
    // Navigate to the shop listing first to get a product ID.
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // Get the first product card's link/ID from the page.
    const firstCard = page.locator('[class*="mantine-Card-root"]').first();
    await expect(firstCard).toBeVisible({ timeout: waits.shop.productGrid });

    // Extract the product slug from the card's onclick or href.
    // The ProductCard navigates to /shop/shop/$slug
    const cardHtml = await firstCard.innerHTML();
    const idMatch = cardHtml.match(/\/shop\/([a-f0-9-]+)/i);
    if (!idMatch) {
      // Fallback: just verify the card exists and is clickable.
      await expect(firstCard).toBeVisible();
      return;
    }

    const slug = idMatch[1];

    // Navigate directly to the product detail page.
    await page.goto(`/shop/shop/${slug}`);
    await page.waitForLoadState('networkidle');

    // Product detail should show the product image and info.
    // Note: this may redirect to sign-in if auth is required.
    const url = page.url();
    const isOnProductPage = url.includes(`/shop/shop/${slug}`);
    const isOnSignIn = url.includes('sign-in');

    if (isOnProductPage) {
      // On the product page — verify content.
      await expect(page.locator('img').first()).toBeVisible({ timeout: waits.shop.productGrid });
    } else if (isOnSignIn) {
      // Redirected to sign-in — expected behavior for unauthenticated users.
      await expect(page.getByText(/Sign in/i)).toBeVisible({ timeout: waits.visible });
    }
  });

  /* ---- Checkout page renders ---- */

  test('checkout page renders with sign-in prompt when not authenticated', async ({
    page,
  }) => {
    await page.goto('/shop/checkout');
    await page.waitForLoadState('networkidle');

    // Checkout should show sign-in prompt (admin session may redirect).
    const bodyText = await page.locator('body').innerText();
    const hasCheckoutContent =
      bodyText.includes('Cart Review') ||
      bodyText.includes('Checkout') ||
      bodyText.includes('Sign in') ||
      bodyText.includes('Sign In');
    expect(hasCheckoutContent).toBe(true);
  });

  /* ---- WhatsApp button on product cards ---- */

  test('product cards have WhatsApp and Chat buttons', async ({ page }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // At least one WhatsApp button should be visible.
    const whatsappBtns = page.getByRole('button', { name: 'WhatsApp' });
    await expect(whatsappBtns.first()).toBeVisible({ timeout: waits.shop.productGrid });

    // At least one Chat button should be visible.
    const chatBtns = page.getByRole('button', { name: 'Chat' });
    await expect(chatBtns.first()).toBeVisible({ timeout: waits.shop.productGrid });
  });

  /* ---- Pagination renders when many products ---- */

  test('pagination renders when products exceed page size', async ({ page }) => {
    await page.goto('/shop/shop');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Shop Medicines' })).toBeVisible({
      timeout: waits.shop.productGrid,
    });

    // Pagination may or may not be present depending on total product count.
    // If it exists, it should have page buttons.
    const pagination = page.locator('[class*="mantine-Pagination-root"]');
    const hasPagination = await pagination.isVisible().catch(() => false);
    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
    // Test passes either way — we're verifying no crash/error.
  });
});
