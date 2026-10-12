import { describe, expect, it } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ARTIFACTS_ROOT, resolveOutputDir } from './output-dir';

/**
 * ui#107 — concurrent configured Playwright runs shared one outputDir, and
 * each run's startup clean wiped the sibling's in-flight traces
 * (browserContext.close ENOENT). The default dir must be run-scoped; an
 * explicit PLAYWRIGHT_OUTPUT_DIR override must keep working verbatim.
 */
describe('resolveOutputDir — run-scoped Playwright artifacts (ui#107)', () => {
  it('scopes the default outputDir per run under the shared root', () => {
    expect(resolveOutputDir({}, 4242)).toBe(join(ARTIFACTS_ROOT, 'run-4242'));
    expect(ARTIFACTS_ROOT).toBe(join(tmpdir(), 'rxsoft-e2e-artifacts'));
  });

  it('gives concurrent runs distinct dirs so no run cleans a sibling', () => {
    const runA = resolveOutputDir({}, 111);
    const runB = resolveOutputDir({}, 222);

    expect(runA).not.toBe(runB);
    // Neither run's dir is an ancestor of the other — Playwright's startup
    // clean of one can never reach inside the other's.
    expect(runA.startsWith(runB)).toBe(false);
    expect(runB.startsWith(runA)).toBe(false);
  });

  it('respects an explicit PLAYWRIGHT_OUTPUT_DIR override verbatim (no pid suffix)', () => {
    expect(resolveOutputDir({ PLAYWRIGHT_OUTPUT_DIR: './test-results' }, 4242)).toBe(
      './test-results',
    );
  });
});
