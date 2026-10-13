import { describe, expect, it } from 'vitest';
import { auditFeaturesSource, report } from './add-testid.mjs';
/**
 * Interim CI gate for ui#68 (spec: e2e/tasks/data_test_id_task.md §5 — "CI grep
 * gate (cheap interim) ... replace with the lint rule once available").
 *
 * Runs the add-testid.mjs scanner over `src/features/**` and compares the
 * offender count against the committed baseline:
 *  - count grows  -> fail with the new-offender report (never erodes)
 *  - count shrinks -> pass and (log) suggest updating the baseline
 *
 * The lint rule (§5) replaces this once oxlint custom rules land; the weekly
 * Playwright crawl (e2e/tests/rxsoft/testid-audit.spec.ts, RUN_TESTID_AUDIT=1)
 * covers rendered output rather than source text.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = join(HERE, 'testid-audit-baseline.json');

describe('testid audit baseline (ui#68 §5 interim gate)', () => {
  it('never gains interactive components without data-testid', () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as {
      count: number;
    };
    const offenders = auditFeaturesSource();
    const extra = offenders.length - baseline.count;

    if (extra > 0) {
      // List everything, newest offenders last, so the fix is actionable.
      const tail = offenders.slice(Math.max(0, baseline.count));
      throw new Error(
        `${extra} new interactive component(s) without data-testid (baseline ${baseline.count}, now ${offenders.length}).\n\n` +
          `${report(tail)}\n\nFix the new elements (or extend their wrapper to carry the testid), then re-run.`
      );
    }

    if (extra < 0) {
      console.warn(
        `testid audit: ${-extra} offender(s) fixed — consider refreshing the baseline:\n` +
          '  node e2e/tasks/codemods/add-testid.mjs --update-baseline'
      );
    }
    expect(extra).toBeLessThanOrEqual(0);
  });
});
