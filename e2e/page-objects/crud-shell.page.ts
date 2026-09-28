import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { CrudFieldSpec, RxsoftCrudResource } from '../fixtures/rxsoft-resources';

/**
 * Page object for the generic RxSoft CRUD pages rendered by DataPageShell
 * (`src/features/components/page/data-page-shell.tsx`).
 *
 * DOM notes drawn from the actual components:
 *  - HeaderBar: search TextInput (placeholder "Search"), "New"/"Export"/
 *    "Delete" subtle Buttons, "X–Y of N" counter.
 *  - Pagination: Mantine Pagination (<nav aria-label="pagination">), a
 *    left "<N> records total" Text and page-size Select (always rendered).
 *  - DataTable rows: <tbody><tr>; row actions are ActionIcon <button>s whose
 *    lucide svgs expose `lucide-pencil` / `lucide-trash-2` classes.
 *  - ModalDataForm: Mantine Modal -> `[role="dialog"]`; form fields are
 *    wrapped in `LabelField` (a `<Text>` label, NOT a real <label>), so the
 *    input is located as the label Text's following sibling.
 *  - Row delete confirmations use ConfirmDialog (title "Delete Item",
 *    confirm Button "Delete") rendered inside the ActionCell.
 */
export class CrudShellPage {
  readonly page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  get searchInput(): Locator {
    // Strict-mode-safe: some nested route layouts (e.g. /rxsoft/settings
    // renders its layout's Outlet twice for desktop/mobile breakpoints) mount
    // two DataPageShells, hence two header-search inputs. Use the first.
    return this.page.getByTestId('header-search').first();
  }

  get newButton(): Locator {
    return this.page.getByTestId('header-new');
  }

  get exportButton(): Locator {
    return this.page.getByTestId('header-export');
  }

  get recordsTotal(): Locator {
    return this.page.getByTestId('pagination-records-total').first();
  }

  get pagination(): Locator {
    return this.page.getByTestId('pagination-controls').first();
  }

  /** The currently open modal (create/update). */
  get dialog(): Locator {
    return this.page.locator('[role="dialog"]').last();
  }

  /**
   * Strict-mode-safe page title: some routes (e.g. /rxsoft/sales-lines opened
   * with a tab query, /rxsoft/website-orders) render two page-title headings,
   * sometimes with overlapping text ('Orders' vs 'Website Orders'), so match
   * the exact heading text instead of a substring.
   */
  pageTitle(expected: string): Locator {
    const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.page
      .getByTestId('page-title')
      .filter({ hasText: new RegExp(`^\\s*${escaped}\\s*$`) })
      .first();
  }

  async goto(route: string): Promise<void> {
    await this.page.goto(route);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  getRow(text: string): Locator {
    return this.page.getByTestId('data-table-body').locator('tr').filter({ hasText: text }).first();
  }

  /** Locates a row's action button by its lucide icon class (pencil / trash-2). */
  rowAction(text: string, iconClass: 'lucide-pencil' | 'lucide-trash-2'): Locator {
    return this.getRow(text)
      .locator('button')
      .filter({ has: this.page.locator(`svg.${iconClass}`) })
      .first();
  }

  /**
   * Field control root. Scope 'dialog' (default) targets the open modal;
   * scope 'page' targets full-page DataPageForm wizards (e.g. items create
   * at /rxsoft/items/create) where the same LabelField structure is used.
   */
  private fieldRoot(label: string, scope: 'dialog' | 'page' = 'dialog'): Locator {
    const root = scope === 'dialog' ? this.dialog : this.page;
    const labelEl = root.getByText(label, { exact: false }).first();
    return labelEl.locator('xpath=following-sibling::*[1]');
  }

  async fillField(
    label: string,
    value: string,
    scope: 'dialog' | 'page' = 'dialog'
  ): Promise<void> {
    const control = this.fieldRoot(label, scope);
    const input = control.locator('input, textarea').first();
    await input.fill(value);
  }

  async chooseOption(
    label: string,
    option: string,
    scope: 'dialog' | 'page' = 'dialog'
  ): Promise<void> {
    const control = this.fieldRoot(label, scope);
    const combobox = control.locator('input[role="combobox"]');
    // Mantine Select renders a readonly input; if there is no combobox inside
    // the field root the control may BE the input (native select fallback).
    if ((await combobox.count()) === 0) {
      const native = control.locator('select').first();
      await native.selectOption({ label: option });
      return;
    }
    await combobox.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async openCreate(): Promise<void> {
    await this.newButton.click();
    await expect(this.dialog).toBeVisible();
  }

  /** Fills every create field with the given token/static values and submits. */
  async create(resource: RxsoftCrudResource, token: string): Promise<void> {
    await this.openCreate();
    for (const field of resource.createFields) {
      await this.setField(field, token);
    }
    await this.dialog.getByRole('button', { name: 'Create' }).click();
  }

  /** Opens edit on a row, applies the edit field(s), and submits. */
  async edit(resource: RxsoftCrudResource, token: string): Promise<void> {
    if (!resource.editField) {
      return;
    }
    await this.fillField(resource.editField.label, resource.editField.value(token));
    await this.dialog.getByRole('button', { name: 'Update' }).click();
  }

  /** Confirms the row-level delete ConfirmDialog. */
  async confirmDelete(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Delete Item' });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole('button', { name: 'Delete' });
    // The confirm button can stay disabled while a list refetch holds the
    // dialog in a loading state — wait for it to become enabled (observed
    // up to ~25s on slow list endpoints) instead of click-timing-out.
    await expect(confirm).toBeEnabled({ timeout: 45_000 });
    // Mantine re-render churn can swallow the first force-click (the button
    // detaches mid-action). Click, briefly wait for close, and retry.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await confirm.click({ force: true });
      try {
        await expect(dialog).toBeHidden({ timeout: 8_000 });
        return;
      } catch {
        // fall through to a retry
      }
    }
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }

  /**
   * Triggers CSV export through the header Export menu and waits for the
   * success toast. The Export button opens a Mantine dropdown with CSV/PDF
   * items — clicking the button alone downloads nothing.
   */
  async exportCsv(title: string): Promise<void> {
    await this.exportButton.click();
    await this.page.getByRole('menuitem', { name: 'CSV' }).click();
    // Large tables (Items ~39k rows) stream the CSV before the toast — 10s
    // was not enough on a cold backend cache.
    await expect(this.page.getByText(`${title} export downloaded`)).toBeVisible({
      timeout: 30_000,
    });
  }

  private async setField(field: CrudFieldSpec, token: string): Promise<void> {
    if (field.kind === 'select') {
      await this.chooseOption(field.label, field.option);
    } else {
      await this.fillField(field.label, field.value(token));
    }
  }
}
