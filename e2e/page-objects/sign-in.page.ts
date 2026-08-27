import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { adminCredentials } from '../fixtures/data';

/**
 * Page object for the RxSignIn form rendered at /sign-in.
 *
 * Selectors are drawn from `src/features/rxsoft/pages/sign-in/index.tsx`:
 *  - Username TextInput: placeholder "Enter your username" (label is a bare <Text>,
 *    not wired to the input, so `getByLabel` does not match)
 *  - Password PasswordInput: placeholder "Enter your password"
 *  - Submit Button: "Sign In", type="submit"
 *  - Auth-store error is rendered as c="red" text (e.g. "Invalid credentials")
 */
export class SignInPage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  get usernameInput(): Locator {
    return this.page.getByTestId('sign-in-username');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('sign-in-password');
  }

  get submitButton(): Locator {
    return this.page.getByTestId('sign-in-submit');
  }

  async goto(redirectTo?: string): Promise<void> {
    if (redirectTo) {
      await this.page.goto(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
    } else {
      await this.page.goto('/sign-in');
    }
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Fills the form with explicit credentials and submits. */
  async signIn(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }

  /** Fills the form with the active suite credentials (fresh org owner, else DEFAULT admin) and submits. */
  async signInAsAdmin(): Promise<void> {
    const creds = adminCredentials();
    await this.signIn(creds.username, creds.password);
  }

  /** Asserts the auth-store error text is visible (e.g. "Invalid credentials"). */
  async expectError(message: string): Promise<void> {
    const errorLocator = this.page.getByTestId('sign-in-error');
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText(message);
  }

  /**
   * Waits until the app has navigated off /sign-in after a successful login.
   * The sign-in form redirects via window.location.href, so waitForURL is used.
   */
  async expectSuccessRedirect(): Promise<void> {
    await this.page.waitForURL((url) => !url.pathname.includes('/sign-in'));
  }
}