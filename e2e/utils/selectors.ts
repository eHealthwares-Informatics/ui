import type { Locator, Page } from '@playwright/test';

/**
 * Shared selectors for the app-wide error surfaces, mirroring
 * `src/features/errors/not-found-error.tsx` and `general-error.tsx`.
 */
export function notFoundH1(page: Page): Locator {
  return page.getByTestId('error-not-found-h1');
}

export function notFoundBody(page: Page): Locator {
  return page.getByText('Oops! Page Not Found!');
}

export function notFoundButtons(page: Page): { goBack: Locator; backToHome: Locator } {
  return {
    goBack: page.getByTestId('error-go-back'),
    backToHome: page.getByTestId('error-back-to-home'),
  };
}

export function generalErrorH1(page: Page): Locator {
  return page.getByTestId('error-general-h1');
}

export function generalErrorBody(page: Page): Locator {
  return page.getByTestId('error-general-body');
}