import { expect, skipIfBackendDown, test } from '../../fixtures/test';
import { apiFetch } from '../../utils/api';

/**
 * Journal Entry Lines — #299 / UC-RX-JOURNAL-ENTRY-LINES-01/02/06/07
 * (ehealthwares/rxsoft#299). Route: /rxsoft/journal-entry-lines.
 *
 * The page (features/rxsoft/pages/journal-entry-lines/index.tsx) is a
 * DataPageShell whose endpoint is ENTRY-SCOPED:
 *   /journal-entries/${entryId}/lines
 * and the shell mounts only after an entry is picked from the
 * "Select a journal entry" Select. The generic crud-suite registry cannot
 * drive that selection step, so this is a bespoke serial spec.
 *
 * Covers:
 *   TC-RX-JOURNAL-ENTRY-LINES-01  list renders (page + entry select + shell)
 *   TC-RX-JOURNAL-ENTRY-LINES-02  column sort (probe, when lines render)
 *   TC-RX-JOURNAL-ENTRY-LINES-03  pagination controls render
 *   TC-RX-JOURNAL-ENTRY-LINES-06/07/08  search family — GATE (search needs a
 *     created record; create is not exercised on financial lines)
 *   TC-RX-JOURNAL-ENTRY-LINES-20/21  export — GATE (config ships no export)
 *   TC-RX-JOURNAL-ENTRY-LINES-22  API error surfaces (mocked 500)
 *   TC-RX-JOURNAL-ENTRY-LINES-23  keyboard navigation to the entry select
 */

type EntryRow = { id: string; entryNumber: string };

test.describe.serial('RxSoft Journal Entry Lines', () => {
  let firstEntry: EntryRow | null = null;

  test('self-setup: resolve a journal entry to scope the lines view', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    const res = await apiFetch<{ data?: EntryRow[] }>(page, '/journal-entries?limit=5');
    firstEntry = res.data?.[0] ?? null;
    // Not a skip-worthy condition for the suite — the render test gates on it.
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-01: page renders and the scoped lines list mounts', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.skip(
      !firstEntry,
      'no journal entries exist in this org — the entry-scoped list cannot mount (view renders only the selector)'
    );

    await page.goto('/rxsoft/journal-entry-lines');
    await expect(page.getByTestId('page-title')).toHaveText('Journal Entry Lines');
    await expect(page.getByText('Select Journal Entry', { exact: true })).toBeVisible();

    // Pick the first entry — the DataPageShell mounts for that entry.
    const select = page.getByPlaceholder('Select a journal entry');
    await select.click();
    const option = page.getByRole('option', { name: firstEntry!.entryNumber }).first();
    await expect(option).toBeVisible({ timeout: 15_000 });
    await option.click();

    await expect(page.getByTestId('header-search').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('data-table-body')).toBeVisible();
    for (const header of ['Line #', 'GL Account', 'Party', 'Debit', 'Credit']) {
      await expect(page.locator('th').filter({ hasText: header }).first()).toBeVisible();
    }
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-02: column sort probe on the scoped table', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.skip(!firstEntry, 'no journal entries available to scope the table');
    await page.goto('/rxsoft/journal-entry-lines');

    const select = page.getByPlaceholder('Select a journal entry');
    await select.click();
    const option = page.getByRole('option', { name: firstEntry!.entryNumber }).first();
    await option.click();
    await expect(page.getByTestId('header-search').first()).toBeVisible({ timeout: 30_000 });

    // Same honest pattern as the crud-suite: click a "Sort by" ActionIcon and
    // assert a sortBy request fires at the entry-scoped endpoint.
    const sortRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('sortBy=')) sortRequests.push(req.url());
    });
    const sortBtn = page.getByRole('button', { name: /^Sort by / }).first();
    if ((await sortBtn.count()) === 0) {
      test.skip(true, 'no sortable headers on the lines table');
    }
    await sortBtn.click();
    await expect.poll(() => sortRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-03: pagination controls render', async ({ page }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.skip(!firstEntry, 'no journal entries available to scope the table');
    await page.goto('/rxsoft/journal-entry-lines');

    const select = page.getByPlaceholder('Select a journal entry');
    await select.click();
    const option = page.getByRole('option', { name: firstEntry!.entryNumber }).first();
    await option.click();
    await expect(page.getByTestId('pagination-records-total').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-06: search narrows — GATE (no created-record path)', async () => {
    test.skip(
      true,
      'the lines view has no suite-created record to search for; create is not exercised on financial lines (glAccountId is a raw id field)'
    );
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-07: search clear — GATE (see TC-06)', async () => {
    test.skip(true, 'see TC-RX-JOURNAL-ENTRY-LINES-06 gate note');
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-08: debounced request — GATE (see TC-06)', async () => {
    test.skip(true, 'see TC-RX-JOURNAL-ENTRY-LINES-06 gate note');
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-20: export triggers download — GATE (no export capability)', async () => {
    test.skip(true, 'the journal-entry-lines ModelConfig ships no canExport/csvEndpoint');
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-21: CSV contents — GATE (no export capability)', async () => {
    test.skip(true, 'see TC-RX-JOURNAL-ENTRY-LINES-20 gate note');
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-22: API error surfaces on the scoped table', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    test.skip(!firstEntry, 'no journal entries available to scope the table');
    await page.route('**/journal-entries/*/lines**', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/rxsoft/journal-entry-lines');
    const select = page.getByPlaceholder('Select a journal entry');
    await select.click();
    const option = page.getByRole('option', { name: firstEntry!.entryNumber }).first();
    await option.click();

    // The shell must surface the failure (error text) without crashing —
    // DataPageShell renders a "Failed to load" style message on non-2xx.
    await expect(page.getByText(/failed to load/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('TC-RX-JOURNAL-ENTRY-LINES-23: entry select is keyboard reachable', async ({
    page,
  }, testInfo) => {
    skipIfBackendDown(testInfo);
    await page.goto('/rxsoft/journal-entry-lines');
    await expect(page.getByTestId('page-title')).toHaveText('Journal Entry Lines');

    let reached = false;
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement | null;
        return Boolean(
          el &&
          (el.placeholder === 'Select a journal entry' ||
            /Search/.test(el.getAttribute('aria-label') ?? '') ||
            (el instanceof HTMLInputElement && el.type === 'search'))
        );
      });
      if (reached) break;
    }
    expect(reached, 'Tab navigation must reach the entry select / search').toBe(true);
  });
});
