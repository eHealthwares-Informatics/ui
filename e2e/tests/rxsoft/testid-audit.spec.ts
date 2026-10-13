import { expect, test, type Locator } from '@playwright/test';

/**
 * Rendered-output audit for ui#68 (spec: e2e/tasks/data_test_id_task.md §5's
 * "e2e guard"). Crawls every ModelConfig page reachable from the /rxsoft hub,
 * opens its create modal, and asserts that every interactive element inside
 * the modal carries a data-testid (rule 1 of the AGENTS.md Alpha QA workflow).
 *
 * Deliberately NOT enabled per-PR: it needs a live backend (the shared admin
 * storage state) and takes minutes. Run it weekly (or ad hoc) with:
 *
 *   RUN_TESTID_AUDIT=1 npx playwright test tests/rxsoft/testid-audit.spec.ts
 *
 * Source-level gating (the per-build never-erodes gate) lives continuously in
 * the vitest baseline test: e2e/tasks/codemods/testid-audit.test.ts.
 */

// Gated off by default so routine runs (CI / local) stay fast; opt in with
// RUN_TESTID_AUDIT=1 for the weekly cycle (or ad-hoc verification).
test.skip(process.env.RUN_TESTID_AUDIT !== '1', 'Weekly audit: set RUN_TESTID_AUDIT=1 to run');

function describeInteractive(el: {
  tag: string;
  text: string;
  id: string;
  placeholder: unknown;
  name: unknown;
}): string {
  const label = [el.id, el.placeholder, el.name, el.text].filter(Boolean).join(' ');
  return `<${el.tag.toLowerCase()}>${label ? ` "${label.slice(0, 60)}"` : ''}`;
}

async function interactiveWithoutTestId(scope: Locator): Promise<string[]> {
  const handles = await scope
    .locator('input:not([type="hidden"]), select, textarea, button')
    .evaluateAll((elements) =>
      elements
        .filter((el) => !el.hasAttribute('data-testid') && !el.closest('[data-testid]'))
        .map((el) => ({
          tag: el.tagName,
          text: (el.textContent ?? '').trim(),
          id: el.getAttribute('id') ?? '',
          placeholder: el.getAttribute('placeholder'),
          name: el.getAttribute('name'),
        }))
    );
  return handles.map(describeInteractive);
}

test('.Alpha UI exposes data-testid on every interactive element of each ModelConfig form', async ({
  page,
}) => {
  type PageFindings = { path: string; missing: string[] };
  const findings: PageFindings[] = [];

  // Discover ModelConfig pages from the admin hub sidebar links (no nav
  // testid assumption): every internal href under /rxsoft/.
  await page.goto('/rxsoft');
  const hrefs: string[] = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/rxsoft"]')]
      .map((a) => new URL(a.getAttribute('href')!, location.origin).pathname)
      // ?page / ?modal params stay; duplicates collapse; hash-less only.
      .filter((p) => !p.includes('#'))
  );
  const paths = [...new Set(hrefs)];
  expect(paths.length, 'expected ModelConfig pages under /rxsoft').toBeGreaterThan(0);

  for (const path of paths) {
    await page.goto(path);
    const newButton = page.getByTestId('header-new');
    // Non-ModelConfig screens (dashboard, reports, lookup charts) have no
    // create-entry and no form modal; skip them.
    if ((await newButton.count()) === 0) continue;

    await newButton.click();
    const modal = page.getByTestId('modal-form');
    await expect(modal).toBeVisible();

    const missing = await interactiveWithoutTestId(modal);
    if (missing.length > 0) findings.push({ path, missing });

    await page.getByTestId('form-cancel').click();
    await expect(modal).toBeHidden();
  }

  // Single failure with the full list, so a weekly run surfaces everything.
  expect(
    findings,
    `pages with testid-less interactive elements:\n${findings.map((f) => `${f.path}: ${f.missing.join('; ')}`).join('\n')}`
  ).toEqual([]);
});
