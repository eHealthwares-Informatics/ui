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
    return this.page.getByTestId('header-search');
  }

  get newButton(): Locator {
    return this.page.getByTestId('header-new');
  }

  get exportButton(): Locator {
    return this.page.getByTestId('header-export');
  }

  get recordsTotal(): Locator {
    return this.page.getByTestId('pagination-records-total');
  }

  get pagination(): Locator {
    return this.page.getByTestId('pagination-controls');
  }

  /** The currently open modal (create/update). */
  get dialog(): Locator {
    return this.page.locator('[role="dialog"]').last();
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
    return this.getRow(text).locator('button').filter({ has: this.page.locator(`svg.${iconClass}`) });
  }

  /** The label Text is the first child of a LabelField Stack; the field control is its next sibling. */
  private fieldRoot(label: string): Locator {
    const labelEl = this.dialog.getByText(label, { exact: false }).first();
    return labelEl.locator('xpath=following-sibling::*[1]');
  }

  async fillField(label: string, value: string): Promise<void> {
    const control = this.fieldRoot(label);
    const input = control.locator('input, textarea').first();
    await input.fill(value);
  }

  async chooseOption(label: string, option: string): Promise<void> {
    const control = this.fieldRoot(label);
    await control.locator('input[role="combobox"]').click();
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
    if (!resource.editField) return;
    await this.fillField(resource.editField.label, resource.editField.value(token));
    await this.dialog.getByRole('button', { name: 'Update' }).click();
  }

  /** Confirms the row-level delete ConfirmDialog. */
  async confirmDelete(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Delete Item' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog).toBeHidden();
  }

  private async setField(field: CrudFieldSpec, token: string): Promise<void> {
    if (field.kind === 'select') {
      await this.chooseOption(field.label, field.option);
    } else {
      await this.fillField(field.label, field.value(token));
    }
  }
}