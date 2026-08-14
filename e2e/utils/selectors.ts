import type { Locator, Page } from '@playwright/test';

/**
 * Shared selectors for the app-wide error surfaces, mirroring
 * `src/features/errors/not-found-error.tsx` and `general-error.tsx`.
 */
export function notFoundH1(page: Page): Locator {
  return page.getByRole('heading', { name: '404' });
}

export function notFoundBody(page: Page): Locator {
  return page.getByText('Oops! Page Not Found!');
}

export function notFoundButtons(page: Page): { goBack: Locator; backToHome: Locator } {
  return {
    goBack: page.getByRole('button', { name: 'Go Back' }),
    backToHome: page.getByRole('button', { name: 'Back to Home' }),
  };
}

export function generalErrorH1(page: Page): Locator {
  return page.getByRole('heading', { name: '500' });
}

export function generalErrorBody(page: Page): Locator {
  return page.getByText('Oops! Something went wrong');
}