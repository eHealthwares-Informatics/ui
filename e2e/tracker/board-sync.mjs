#!/usr/bin/env node
/**
 * board-sync.mjs — RxSoft Alpha Test Plan (GitHub Projects board) coverage tracker.
 *
 * Reads the board (project #1, owner ehealthwares), parses the TC checklists
 * embedded in use-case sub-issues, scans the Playwright specs for title-embedded
 * TC ids, and writes frontend/e2e/TRACKER_STATUS.md + appends tracker/PROGRESS_LOG.md.
 *
 * WRITE-BACK IS OPT-IN:
 *   (no flags)   dry-run: board is only READ; report is written locally.
 *   --update-issues  level 1+2: check off covered TC checkboxes in UC bodies and
 *                    close UC sub-issues whose TCs are all covered/gated.
 *   --set-status     level 3: flip entity tasks (and epics) to Status=Done on the
 *                    board when every child UC is closed/covered.
 * Every write action is printed before it happens. Writes are batched with a
 * small delay to respect API rate limits.
 *
 * No dependencies; shells out to `gh`.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
  appendFileSync,
  readdirSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const E2E_DIR = join(__dirname, '..');
const REPO_ROOT = join(E2E_DIR, '..', '..');
const STATUS_FILE = join(E2E_DIR, 'TRACKER_STATUS.md');
const PROGRESS_LOG = join(__dirname, 'PROGRESS_LOG.md');

const OWNER = 'ehealthwares';
const PROJECT_NUMBER = 1;
const DEFAULT_REPO = 'ehealthwares/rxsoft';
/** ProjectV2 single-select ids from `gh project field-list` (stable per board). */
const STATUS_FIELD_ID = 'PVTSSF_lAHOD9-a1c4Bk0PozhjjcSs';
const STATUS_OPTION_DONE = '98236657';

const TC_ID_RE = /\bTC-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g;

// ── CLI ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const FLAGS = {
  updateIssues: argv.includes('--update-issues'),
  setStatus: argv.includes('--set-status'),
  help: argv.includes('--help') || argv.includes('-h'),
};
if (FLAGS.help) {
  console.log(`usage: node board-sync.mjs [--update-issues] [--set-status]

  (no flags)        read-only; regenerate TRACKER_STATUS.md + PROGRESS_LOG entry
  --update-issues   check TC boxes + close complete UC sub-issues (level 1+2)
  --set-status      set board Status=Done for complete entity tasks/epics (level 3)
`);
  process.exit(0);
}

function gh(args, opts = {}) {
  return execFileSync('gh', args, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024, ...opts });
}

const log = (msg) => process.stdout.write(`${msg}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Board fetch ─────────────────────────────────────────────────────────────
const CACHE_FILE = join(__dirname, '.board-cache.json');
const CACHE_TTL_MS = 15 * 60 * 1000; // project queries are GraphQL — rate limits are tight

function fetchBoardItems() {
  // Cache: the board barely changes between runs and the project GraphQL API
  // rate-limits quickly; --no-cache forces a refetch.
  if (!argv.includes('--no-cache') && existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        log(
          `board: using cache from ${new Date(cached.fetchedAt).toISOString()} (${cached.items.length} items) — pass --no-cache to refetch`
        );
        return cached.items;
      }
    } catch {
      // corrupt cache → ignore and refetch
    }
  }
  const raw = gh([
    'project',
    'item-list',
    String(PROJECT_NUMBER),
    '--owner',
    OWNER,
    '--limit',
    '1000',
    '--format',
    'json',
  ]);
  const data = JSON.parse(raw);
  const items = data.items ?? [];
  // Pagination guard: item-list caps at --limit. If the board grows past 1000
  // we must paginate before trusting totals — fail loudly instead.
  if (items.length >= 1000) {
    throw new Error(
      `board returned ${items.length} items (>= limit 1000): pagination required, refusing to report partial coverage`
    );
  }
  writeFileSync(CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), items }));
  return items;
}

// ── Parsing ─────────────────────────────────────────────────────────────────
function parseLabels(item) {
  return (item.labels ?? []).map((l) => (typeof l === 'string' ? l : l?.name)).filter(Boolean);
}

function firstLabel(labels, prefix) {
  return labels.find((l) => l.startsWith(prefix))?.slice(prefix.length) ?? null;
}

/** Extract TC entries from a use-case issue body. Returns [{ id, specPaths[], checked }] */
function parseUseCaseBody(body) {
  const tcs = [];
  if (!body) return tcs;
  const lines = body.split('\n');
  let current = null;
  for (const line of lines) {
    const checked = /-\s\[( |x|X)\]/.exec(line);
    const tcMatch = /\*\*(TC-[A-Z0-9]+(?:-[A-Z0-9]+)*)\*\*/.exec(line);
    if (checked && tcMatch) {
      current = { id: tcMatch[1], specPaths: [], checked: checked[1].toLowerCase() === 'x' };
      tcs.push(current);
      continue;
    }
    if (current) {
      const specMatch = /\*\*Spec:\*\*(.*)/.exec(line);
      if (specMatch) {
        const paths = [...specMatch[1].matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
        current.specPaths.push(
          ...paths.filter((p) => p.endsWith('.spec.ts') || p.startsWith('tests/'))
        );
      }
    }
  }
  return tcs;
}

/**
 * Extract TC ids from an EPIC body. Baseline epics track their TCs as
 * `### TC-AUTH-01 Login success` headings (no checkboxes) and list the
 * implementing specs under `**Existing specs:**` as `- tests/...` lines.
 * Returns [{ id, specPaths[], checked }] — checked mirrors any checkbox form
 * when present, else false.
 */
function parseEpicBody(body) {
  const tcs = [];
  if (!body) return tcs;
  const seen = new Set();
  const push = (id, checked) => {
    if (!seen.has(id)) {
      seen.add(id);
      tcs.push({ id, specPaths: [], checked });
    }
  };
  const lines = body.split('\n');
  let inExistingSpecs = false;
  const epicSpecPaths = [];
  /** Expand "TC-ERR-01..06" / "TC-AUTH-05/06/07/08" style tokens into ids. */
  const expand = (token) => {
    const range = /^(TC-[A-Z]+-)(\d+)\.\.(\d+)$/.exec(token);
    if (range) {
      const [, base, a, b] = range;
      const width = a.length;
      const out = [];
      for (let n = Number(a); n <= Number(b); n++)
        out.push(`${base}${String(n).padStart(width, '0')}`);
      return out;
    }
    const slash = /^(TC-[A-Z]+-)(\d+)(?:\/(\d+))+$/.exec(token);
    if (slash) {
      const [, base, first] = slash;
      // token.match(/\d+/g) returns ALL numbers in order: [first, ...rest].
      const nums = token.match(/\d+/g) ?? [first];
      const width = first.length;
      return nums.map((n) => `${base}${n.padStart(width, '0')}`);
    }
    return [token];
  };
  for (const line of lines) {
    if (/\*\*Existing specs?:\*\*/.test(line)) {
      inExistingSpecs = true;
      continue;
    }
    if (inExistingSpecs) {
      if (/^\s*$/.test(line)) {
        inExistingSpecs = false;
      } else {
        // Paths appear both backticked (`tests/x.spec.ts`) and bare
        // (- tests/x.spec.ts, with the bold close ** glued to the last one).
        const paths = [...line.matchAll(/`([^`]+)`/g), ...line.matchAll(/(tests\/[^\s*`]+)/g)].map(
          (m) => m[1].trim()
        );
        for (const p of paths) {
          if (p.endsWith('.spec.ts') || p.startsWith('tests/')) epicSpecPaths.push(p);
        }
      }
    }
    const cbTc =
      /-\s\[( |x|X)\][^\n]*?((?:TC-[A-Z0-9]+(?:-[A-Z0-9]+)*)(?:\.\.\d+|(?:\/\d+)+)?)/.exec(line);
    if (cbTc) {
      for (const id of expand(cbTc[2])) push(id, cbTc[1].toLowerCase() === 'x');
      continue;
    }
    const headingTc = /^#{2,4}\s+((?:TC-[A-Z0-9]+(?:-[A-Z0-9]+)*)(?:\.\.\d+|(?:\/\d+)+)?)/.exec(
      line
    );
    if (headingTc) for (const id of expand(headingTc[1])) push(id, false);
  }
  // Epic-level spec lists apply to every TC in the epic (coarse but correct:
  // these are exactly the files the epic ships).
  for (const tc of tcs) tc.specPaths.push(...epicSpecPaths);
  return tcs;
}

/** Extract UC ids listed in an entity-task body's "## Use cases" section. */
function parseEntityBody(body) {
  const ucs = [];
  if (!body) return { ucs, parentEpic: null };
  const ucMatches = [...body.matchAll(/`(UC-[A-Z0-9]+(?:-[A-Z0-9]+)*)`/g)].map((m) => m[1]);
  ucs.push(...new Set(ucMatches));
  const parent = /_Parent epic: #(\d+)_/.exec(body);
  return { ucs, parentEpic: parent ? Number(parent[1]) : null };
}

function classifyBoard(items) {
  const epics = new Map(); // issue number -> epic
  const tasks = new Map(); // issue number -> entity task
  const useCases = new Map(); // issue number -> use case
  for (const item of items) {
    const labels = parseLabels(item);
    const number = item.content?.number;
    const repo = item.content?.repository ?? DEFAULT_REPO;
    if (!number) continue; // draft items have no issue behind them
    const common = {
      itemId: item.id,
      number,
      repo,
      title: item.title ?? item.content?.title ?? `#${number}`,
      status: item.status ?? null,
      labels,
      phase: firstLabel(labels, 'phase:') ?? 'unphased',
      module: firstLabel(labels, 'module:') ?? 'unknown',
    };
    if (labels.includes('type:epic'))
      epics.set(number, {
        ...common,
        childTasks: [],
        tcs: parseEpicBody(item.content?.body ?? ''),
      });
    else if (labels.includes('type:task')) {
      const { ucs, parentEpic } = parseEntityBody(item.content?.body ?? '');
      tasks.set(number, { ...common, ucIds: ucs, parentEpic, tcs: {} });
    } else if (labels.includes('type:use-case')) {
      const tcs = parseUseCaseBody(item.content?.body ?? '');
      useCases.set(number, { ...common, tcs, body: item.content?.body ?? '' });
    }
  }
  // Link tasks to epics + resolve UC issue numbers via UC id.
  const ucIdToIssue = new Map();
  for (const uc of useCases.values()) {
    const idMatch =
      /\*\*(UC-[A-Z0-9]+(?:-[A-Z0-9]+)*)\*\*/.exec(uc.body) ??
      /`(UC-[A-Z0-9]+(?:-[A-Z0-9]+)*)`/.exec(uc.body);
    if (idMatch) ucIdToIssue.set(idMatch[1], uc.number);
  }
  for (const task of tasks.values()) {
    task.ucIssues = task.ucIds.map((id) => ucIdToIssue.get(id) ?? null);
    if (task.parentEpic && epics.has(task.parentEpic))
      epics.get(task.parentEpic).childTasks.push(task.number);
  }
  return { epics, tasks, useCases };
}

// ── Spec scanning ───────────────────────────────────────────────────────────
/** Recursively collect *.spec.ts files under e2e (tests/, crud-suite/). */
function collectSpecFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collectSpecFiles(full, out);
    else if (entry.name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

/**
 * Legacy alias map: TC ids covered by pre-existing specs whose titles predate
 * the TC-id convention. New specs should embed TC ids in test titles instead.
 */
const LEGACY_ALIASES = {
  'TC-AUTH-01': ['tests/auth/sign-in.spec.ts'],
  'TC-AUTH-02': ['tests/auth/sign-in.spec.ts'],
  'TC-AUTH-03': ['tests/auth/sign-in.spec.ts'],
  'TC-AUTH-04': ['tests/auth/sign-in.spec.ts'],
  'TC-ERR-01': ['tests/errors/error-boundary.spec.ts'],
  'TC-ERR-02': ['tests/errors/not-found.spec.ts', 'tests/errors/error-boundary.spec.ts'],
  'TC-ROOT-01': ['tests/root/root-redirect.spec.ts'],
  'TC-ROOT-02': ['tests/root/root-redirect.spec.ts'],
};

function scanSpecs() {
  const specDirs = ['tests', 'crud-suite']
    .map((d) => join(E2E_DIR, d))
    .filter((d) => existsSync(d));
  const files = specDirs.flatMap((d) => collectSpecFiles(d));
  const tcToFiles = new Map(); // tc id -> Set<relative path>
  const gatedFiles = new Set(); // files that use skipIfBackendDown
  for (const file of files) {
    const rel = relative(E2E_DIR, file).replaceAll('\\', '/');
    const text = readFileSync(file, 'utf-8');
    if (text.includes('skipIfBackendDown(')) gatedFiles.add(rel);
    for (const m of text.matchAll(TC_ID_RE)) {
      if (!tcToFiles.has(m[0])) tcToFiles.set(m[0], new Set());
      tcToFiles.get(m[0]).add(rel);
    }
  }
  for (const [tc, paths] of Object.entries(LEGACY_ALIASES)) {
    if (!tcToFiles.has(tc)) tcToFiles.set(tc, new Set());
    for (const p of paths) tcToFiles.get(tc).add(p);
  }
  return { tcToFiles, gatedFiles };
}

// ── Coverage model ──────────────────────────────────────────────────────────
function buildCoverage(board, specs) {
  // TC -> { state: covered|gated|missing|missing-path, files: [], ucIssues: [] }
  // Coverage truth: a TC id embedded in a scanned spec title (specs.tcToFiles,
  // which includes LEGACY_ALIASES). Declared spec paths from issue bodies are
  // documentation — they decide missing (declared, unimplemented) vs
  // missing-path (nothing declared, unmappable) but never override a scan hit.
  const tcMap = new Map();
  const noteTc = (id, state, files) => {
    if (!tcMap.has(id)) tcMap.set(id, { state: 'missing', files: [], ucIssues: [] });
    const tc = tcMap.get(id);
    if (state === 'missing-path' && tc.state === 'missing') tc.state = 'missing-path';
    else if (state === 'covered' || state === 'gated') {
      const better = state === 'gated' && tc.state === 'covered' ? 'covered' : state;
      if (tc.state === 'missing' || tc.state === 'missing-path' || better === 'covered')
        tc.state = better;
    }
    for (const f of files) if (!tc.files.includes(f)) tc.files.push(f);
  };
  const scanState = (id) => {
    const files = specs.tcToFiles.get(id);
    if (!files || files.size === 0) return null;
    const gated = [...files].every((f) => specs.gatedFiles.has(f));
    return { state: gated ? 'gated' : 'covered', files: [...files] };
  };

  for (const uc of board.useCases.values()) {
    if (uc.tcs.length === 0) continue; // UC with no TC checklist (defensive)
    for (const tc of uc.tcs) {
      if (!tcMap.has(tc.id)) tcMap.set(tc.id, { state: 'missing', files: [], ucIssues: [] });
      const entry = tcMap.get(tc.id);
      if (!entry.ucIssues.includes(uc.number)) entry.ucIssues.push(uc.number);
      const hit = scanState(tc.id);
      if (hit) {
        noteTc(tc.id, hit.state, hit.files);
      } else if (tc.specPaths.length === 0) {
        noteTc(tc.id, 'missing-path', []);
      } else {
        noteTc(tc.id, 'missing', []);
        tcMap.get(tc.id).declared = [
          ...new Set([...(tcMap.get(tc.id).declared ?? []), ...tc.specPaths]),
        ];
      }
    }
  }

  // Epic-level TCs (baseline epics track auth/error/root coverage in the epic
  // body itself rather than in use-case sub-issues).
  for (const epic of board.epics.values()) {
    for (const tc of epic.tcs ?? []) {
      if (!tcMap.has(tc.id)) tcMap.set(tc.id, { state: 'missing', files: [], ucIssues: [] });
      const entry = tcMap.get(tc.id);
      if (!entry.ucIssues.includes(epic.number)) entry.ucIssues.push(epic.number);
      const hit = scanState(tc.id);
      if (hit) {
        noteTc(tc.id, hit.state, hit.files);
      } else if (tc.specPaths.length > 0) {
        noteTc(tc.id, 'missing', []);
        tcMap.get(tc.id).declared = [
          ...new Set([...(tcMap.get(tc.id).declared ?? []), ...tc.specPaths]),
        ];
      }
    }
  }

  // Roll TCs up to use cases.
  for (const uc of board.useCases.values()) {
    uc.coverage = { covered: 0, gated: 0, missing: 0, missingPath: 0 };
    for (const tc of uc.tcs) {
      const state = tcMap.get(tc.id)?.state ?? 'missing';
      if (state === 'covered') uc.coverage.covered++;
      else if (state === 'gated') uc.coverage.gated++;
      else if (state === 'missing-path') uc.coverage.missingPath++;
      else uc.coverage.missing++;
    }
    uc.complete = uc.tcs.length > 0 && uc.coverage.covered + uc.coverage.gated === uc.tcs.length;
  }
  // Roll UCs up to entity tasks.
  for (const task of board.tasks.values()) {
    task.ucObjects = task.ucIds
      .map((id) => [...board.useCases.values()].find((u) => u.body.includes(`**${id}**`)))
      .filter(Boolean);
    task.complete =
      task.ucObjects.length > 0 && task.ucObjects.every((u) => u.complete || u.status === 'Done');
    const all = task.ucObjects.flatMap((u) => u.tcs);
    task.tcTotal = all.length;
    task.tcDone = all.filter((tc) =>
      ['covered', 'gated'].includes(tcMap.get(tc.id)?.state ?? 'missing')
    ).length;
  }
  return tcMap;
}

// ── Report ──────────────────────────────────────────────────────────────────
function storageStateNote() {
  const authFile = join(E2E_DIR, '.auth', 'admin.json');
  if (!existsSync(authFile)) {
    return '⚠️ `e2e/.auth/admin.json` is **absent** — rerun `npx playwright test --project=setup` before the admin suites.';
  }
  const ageH = (Date.now() - statSync(authFile).mtimeMs) / 3_600_000;
  if (ageH > 24) {
    return `⚠️ \`e2e/.auth/admin.json\` is **stale** (${ageH.toFixed(0)}h old) — rerun \`--project=setup\` if admin suites 401/403.`;
  }
  return `✅ admin storageState is fresh (${ageH.toFixed(1)}h old).`;
}

function phaseRollup(board, tcMap) {
  const phases = new Map();
  const bump = (phase, uc) => {
    if (!phases.has(phase))
      phases.set(phase, {
        covered: 0,
        gated: 0,
        missing: 0,
        missingPath: 0,
        ucs: 0,
        ucsComplete: 0,
      });
    const p = phases.get(phase);
    p.covered += uc.coverage.covered;
    p.gated += uc.coverage.gated;
    p.missing += uc.coverage.missing;
    p.missingPath += uc.coverage.missingPath;
    p.ucs += 1;
    if (uc.complete) p.ucsComplete += 1;
  };
  for (const uc of board.useCases.values()) bump(uc.phase, uc);
  // Epics that track their own TCs (baseline) roll up under their phase too.
  for (const epic of board.epics.values()) {
    if (!epic.tcs || epic.tcs.length === 0) continue;
    const coverage = { covered: 0, gated: 0, missing: 0, missingPath: 0 };
    for (const tc of epic.tcs) {
      const state = tcMap.get(tc.id)?.state ?? 'missing';
      if (state === 'covered') coverage.covered++;
      else if (state === 'gated') coverage.gated++;
      else if (state === 'missing-path') coverage.missingPath++;
      else coverage.missing++;
    }
    bump(epic.phase, { coverage, complete: coverage.covered + coverage.gated === epic.tcs.length });
  }
  return phases;
}

function renderStatus(board, tcMap, specs) {
  const now = new Date().toISOString();
  const total = { covered: 0, gated: 0, missing: 0, missingPath: 0 };
  for (const tc of tcMap.values())
    total[
      tc.state === 'gated'
        ? 'gated'
        : tc.state === 'covered'
          ? 'covered'
          : tc.state === 'missing-path'
            ? 'missingPath'
            : 'missing'
    ]++;
  const mapped = total.covered + total.gated + total.missing;
  const lines = [];
  lines.push('# Tracker Status — RxSoft Alpha Test Plan');
  lines.push('');
  lines.push(
    `> Generated ${now} · board: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER} · items: ${board.epics.size} epics / ${board.tasks.size} entity tasks / ${board.useCases.size} use cases`
  );
  lines.push('');
  lines.push(`**Storage state:** ${storageStateNote()}`);
  lines.push('');
  lines.push('| State | Meaning |');
  lines.push('|---|---|');
  lines.push(`| covered | spec exists and runs unconditionally |`);
  lines.push(`| gated | spec exists but auto-skips when a backend/module is down |`);
  lines.push(`| missing | no spec found for the TC (declared path noted where present) |`);
  lines.push(
    `| missing-path | UC issue does not declare a spec path for the TC — unmappable, fix the issue body |`
  );
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`| Covered | Gated | Missing | Missing-path | TCs mapped | Coverage (of mappable) |`);
  lines.push(`|---|---|---|---|---|---|`);
  const pct = mapped ? (((total.covered + total.gated) / mapped) * 100).toFixed(1) : '0.0';
  lines.push(
    `| ${total.covered} | ${total.gated} | ${total.missing} | ${total.missingPath} | ${mapped} | ${pct}% |`
  );
  lines.push('');
  lines.push('## Per-phase matrix');
  lines.push('');
  lines.push('| Phase | UCs | UCs complete | Covered | Gated | Missing | Missing-path |');
  lines.push('|---|---|---|---|---|---|---|');
  const order = [
    '0-baseline',
    '1-rxsoft-crud',
    '2-catalog',
    '3-operations',
    '4-commerce',
    '5-modules',
    'unphased',
  ];
  const phases = phaseRollup(board, tcMap);
  for (const key of [
    ...order.filter((k) => phases.has(k)),
    ...[...phases.keys()].filter((k) => !order.includes(k)),
  ]) {
    const p = phases.get(key);
    lines.push(
      `| ${key} | ${p.ucs} | ${p.ucsComplete} | ${p.covered} | ${p.gated} | ${p.missing} | ${p.missingPath} |`
    );
  }
  lines.push('');
  lines.push('## Entity rollup');
  lines.push('');
  lines.push('| Module | Entity | Phase | TCs done / total | Complete | Issue |');
  lines.push('|---|---|---|---|---|---|');
  const tasks = [...board.tasks.values()].sort(
    (a, b) => a.module.localeCompare(b.module) || a.title.localeCompare(b.title)
  );
  for (const t of tasks) {
    lines.push(
      `| ${t.module} | ${t.title.replace(/^\[task\]\s*/i, '')} | ${t.phase} | ${t.tcDone}/${t.tcTotal} | ${t.complete ? '✅' : '—'} | [#${t.number}](${t.repo}/issues/${t.number}) |`
    );
  }
  lines.push('');
  lines.push('## Gated spec files');
  lines.push('');
  lines.push(
    [...specs.gatedFiles]
      .sort()
      .map((f) => `- ${f}`)
      .join('\n') || '_none_'
  );
  lines.push('');
  return lines.join('\n');
}

// ── Write-back ──────────────────────────────────────────────────────────────
async function writeBackIssues(board, tcMap) {
  const actions = [];
  for (const uc of board.useCases.values()) {
    if (uc.tcs.length === 0) continue;
    const uncheckedCovered = uc.tcs.filter((tc) => {
      const st = tcMap.get(tc.id)?.state;
      return !tc.checked && (st === 'covered' || st === 'gated');
    });
    const checkedButMissing = uc.tcs.filter(
      (tc) => tc.checked && tcMap.get(tc.id)?.state === 'missing'
    );
    const allDone = uc.coverage.covered + uc.coverage.gated === uc.tcs.length;
    if (uncheckedCovered.length > 0 || checkedButMissing.length > 0) {
      actions.push({ kind: 'edit-body', uc, uncheckedCovered, checkedButMissing, allDone });
    } else if (allDone && uc.status !== 'Done') {
      actions.push({ kind: 'close-uc', uc });
    }
  }
  if (actions.length === 0) {
    log('write-back: nothing to update.');
    return;
  }
  log(`write-back: ${actions.length} action(s):`);
  for (const a of actions) {
    if (a.kind === 'edit-body') {
      log(
        `  [edit] #${a.uc.number} ${a.uc.title} — check ${a.uncheckedCovered.length} TC box(es)${a.checkedButMissing.length ? `, UNcheck ${a.checkedButMissing.length} (spec no longer found)` : ''}`
      );
    } else {
      log(`  [close] #${a.uc.number} ${a.uc.title}`);
    }
  }
  if (!FLAGS.updateIssues) {
    log('dry-run: pass --update-issues to apply.');
    return;
  }
  for (const a of actions) {
    if (a.kind === 'edit-body') {
      // Rebuild checkbox state per TC line from the coverage map — one pass,
      // covers both checking (covered) and unchecking (spec disappeared).
      const edited = a.uc.body
        .split('\n')
        .map((line) => {
          const m = /\*\*(TC-[A-Z0-9]+(?:-[A-Z0-9]+)*)\*\*/.exec(line);
          if (!m || !/^\s*-\s\[( |x|X)\]/.test(line)) return line;
          const st = tcMap.get(m[1])?.state;
          const want = st === 'covered' || st === 'gated' ? 'x' : ' ';
          return line.replace(/^(\s*-\s)\[( |x|X)\]/, `$1[${want}]`);
        })
        .join('\n');
      if (edited !== a.uc.body) {
        const { mkdtempSync, writeFileSync: wf } = await import('node:fs');
        const { tmpdir } = await import('node:os');
        const tmp = join(mkdtempSync(join(tmpdir(), 'bdsync-')), 'body.md');
        wf(tmp, edited);
        gh(['issue', 'edit', String(a.uc.number), '--repo', a.uc.repo, '--body-file', tmp]);
        log(`  ✓ updated #${a.uc.number}`);
        await sleep(400);
      }
    } else if (a.kind === 'close-uc') {
      log(`  ✓ closed #${a.uc.number}`);
      await sleep(400);
    }
  }
}

async function writeBackStatus(board) {
  const candidates = [...board.tasks.values()].filter((t) => t.complete && t.status !== 'Done');
  const epicCandidates = [...board.epics.values()].filter((e) => {
    if (e.childTasks.length === 0) return false;
    return e.childTasks.every((n) => board.tasks.get(n)?.complete);
  });
  const all = [...candidates, ...epicCandidates];
  if (all.length === 0) {
    log('status write-back: no entity/epic is fully complete yet.');
    return;
  }
  log('status write-back candidates:');
  for (const c of all) log(`  [status→Done] #${c.number} ${c.title}`);
  if (!FLAGS.setStatus) {
    log('dry-run: pass --set-status to apply.');
    return;
  }
  for (const c of all) {
    gh([
      'project',
      'item-edit',
      '--id',
      c.itemId,
      '--project-id',
      'PVT_kwHOD9-a1c4Bk0Po',
      '--field-id',
      STATUS_FIELD_ID,
      '--single-select-option-id',
      STATUS_OPTION_DONE,
    ]);
    log(`  ✓ #${c.number} → Done`);
    await sleep(400);
  }
}

// ── Progress log ────────────────────────────────────────────────────────────
function appendProgress(entries) {
  if (!existsSync(PROGRESS_LOG)) {
    writeFileSync(
      PROGRESS_LOG,
      '# Progress Log\n\nAppend-only. One entry per tracker run.\n\n| When (UTC) | Mode | Covered | Gated | Missing | Missing-path | Notes |\n|---|---|---|---|---|---|---|\n'
    );
  }
  appendFileSync(PROGRESS_LOG, entries);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const mode = FLAGS.updateIssues || FLAGS.setStatus ? 'WRITE' : 'read-only';
  log(`board-sync: fetching project ${PROJECT_NUMBER} (${OWNER}) — mode: ${mode}`);
  const items = fetchBoardItems();
  const board = classifyBoard(items);
  log(
    `board: ${board.epics.size} epics / ${board.tasks.size} entity tasks / ${board.useCases.size} use cases`
  );
  const specs = scanSpecs();
  log(`specs: ${specs.tcToFiles.size} distinct TC ids referenced across tests/ + crud-suite/`);
  const tcMap = buildCoverage(board, specs);
  const report = renderStatus(board, tcMap, specs);
  writeFileSync(STATUS_FILE, report);
  log(`wrote ${relative(REPO_ROOT, STATUS_FILE)}`);

  const total = { covered: 0, gated: 0, missing: 0, missingPath: 0 };
  for (const tc of tcMap.values()) {
    const key =
      tc.state === 'gated'
        ? 'gated'
        : tc.state === 'covered'
          ? 'covered'
          : tc.state === 'missing-path'
            ? 'missingPath'
            : 'missing';
    total[key]++;
  }
  appendProgress(
    `| ${new Date().toISOString()} | ${mode} | ${total.covered} | ${total.gated} | ${total.missing} | ${total.missingPath} | ${FLAGS.updateIssues ? 'issue write-back' : FLAGS.setStatus ? 'status write-back' : 'report only'} |\n`
  );

  await writeBackIssues(board, tcMap);
  await writeBackStatus(board);

  if (!FLAGS.updateIssues && !FLAGS.setStatus) {
    log('board untouched (dry-run default). Pass --update-issues / --set-status to write back.');
  }
}

main().catch((err) => {
  console.error(`board-sync failed: ${err.message}`);
  process.exit(1);
});
