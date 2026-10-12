import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Shared root for Playwright failure artifacts. Kept OUTSIDE the repo root so
 * the Vite dev server started by `webServer` never watches it (ui#94) — any
 * write inside a watched directory fires a full HMR page reload that kills
 * the in-flight navigation that was about to be asserted.
 */
export const ARTIFACTS_ROOT = join(tmpdir(), 'rxsoft-e2e-artifacts');

/**
 * Playwright cleans `outputDir` when a run starts, so two configured runs
 * sharing one directory destroy each other's in-flight traces and
 * screenshots: a concurrently-started default-dir run wiped the shared
 * `rxsoft-e2e-artifacts` root and failed `browserContext.close` with ENOENT
 * mid-suite — three runs' failure evidence lost in one day (ui#107).
 *
 * Resolution: the DEFAULT dir is scoped per run (pid), so no run can ever
 * clean a sibling run's artifacts. An explicit PLAYWRIGHT_OUTPUT_DIR
 * override is still respected VERBATIM — the operator chose that location
 * (e.g. a single isolated debug run pointed back inside the repo) and owns
 * the concurrency risk.
 */
export function resolveOutputDir(
  env: Pick<NodeJS.ProcessEnv, 'PLAYWRIGHT_OUTPUT_DIR'> = process.env,
  pid: number = process.pid,
): string {
  const override = env.PLAYWRIGHT_OUTPUT_DIR;
  if (override) {
    return override;
  }
  return join(ARTIFACTS_ROOT, `run-${pid}`);
}
