import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Page object for the authenticated app shell (AppSidebar + NavUser + dialogs).
 *
 * Sign-out flow, from `src/layout/app-sidebar.tsx`, `src/layout/nav-user.tsx`,
 * `src/components/sign-out-dialog.tsx` and `src/components/confirm-dialog.tsx`:
 *  1. NavUser renders an UnstyledButton (containing ChevronsUpDown icon) which
 *     opens a Mantine Menu.
 *  2. The "Sign out" MenuItem mounts the SignOutDialog.
 *  3. The dialog renders a Mantine Modal (title "Sign out") with a destructive
 *     red confirm Button (also labelled "Sign out").
 */
export class AppLayoutPage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  get navUserTrigger(): Locator {
    return this.page.getByTestId('nav-user-trigger');
  }

  get signOutMenuItem(): Locator {
    return this.page.getByTestId('sign-out-menu-item');
  }

  get signOutDialog(): Locator {
    return this.page.getByTestId('confirm-dialog');
  }

  get confirmSignOutButton(): Locator {
    return this.signOutDialog.getByTestId('confirm-dialog-confirm');
  }

  /** Opens the NavUser menu and clicks the "Sign out" item. */
  async openSignOut(): Promise<void> {
    // dispatchEvent bypasses Playwright's scroll/actionability math, which stalls
    // on Mantine's nested ScrollArea; the menu opens on any click.
    await this.navUserTrigger.dispatchEvent('click');
    await expect(this.signOutMenuItem).toBeVisible();
    await this.signOutMenuItem.click();
  }

  /** Confirms the destructive sign-out from the ConfirmDialog. */
  async confirmSignOut(): Promise<void> {
    await expect(this.signOutDialog).toBeVisible();
    await this.confirmSignOutButton.click();
  }

  /** Full sign-out: open menu, click item, confirm modal, wait for /sign-in. */
  async signOut(): Promise<void> {
    await this.openSignOut();
    await this.confirmSignOut();
    await this.page.waitForURL((url) => url.pathname.includes('/sign-in'));
  }
}