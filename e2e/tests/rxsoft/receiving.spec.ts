import { expect, test } from '../../fixtures/test';

/**
 * RxSoft Goods Receiving → unpost a receipt line.
 *
 * Opens the first receipt's detail modal, unposts its first active line using
 * the backend's unpost password ('password12'), and asserts the success toast.
 * Mutates live data (one seeded receipt line becomes 'Unposted').
 */
test.describe('RxSoft goods receiving', () => {
  test('lists receipts and unposts a line through the detail modal', async ({ page }) => {
    await page.goto('/rxsoft/receiving');

    await page.addStyleTag({
      content: '.tsqd-parent-container, [class*="tsqd-"]{display:none !important}',
    });

    const firstRow = page.getByTestId('data-table-body').locator('tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15_000 });

    // The receipt number is an <Anchor component="button"> — click it.
    const receiptLink = firstRow.locator('button').first();
    await expect(receiptLink).toBeVisible({ timeout: 15_000 });
    const receiptNumber = (await receiptLink.innerText()).trim();
    await receiptLink.click();

    const dialog = page.getByRole('dialog', { name: /Receipt #/ });
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    const unpostButton = dialog.getByRole('button', { name: 'Unpost', exact: true }).first();
    await expect(unpostButton).toBeEnabled({ timeout: 15_000 });
    await unpostButton.click();

    await dialog.getByLabel('Unpost Password').fill('password12');
    await dialog.getByRole('button', { name: 'Confirm Unpost' }).click();

    await expect(page.getByText('Line unposted successfully.')).toBeVisible({
      timeout: 15_000,
    });
    void receiptNumber;
  });
});