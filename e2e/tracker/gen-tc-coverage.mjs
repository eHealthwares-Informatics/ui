#!/usr/bin/env node
/**
 * gen-tc-coverage.mjs — generates crud-suite → board TC-id coverage files.
 *
 * Reads `.board-cache.json` (written by `board-sync.mjs`) and
 * `fixtures/rxsoft-resources.ts` (as text), then emits:
 *
 *   crud-suite/tc-covered.generated.ts — TC ids the parameterized suite truly
 *     asserts (list render, search, pagination, create, edit, delete, CSV)
 *     given each resource's declared capabilities;
 *   crud-suite/tc-gated.generated.ts   — TC ids declared on the board but
 *     deliberately not exercised (validation/cancel branches, PDF, a11y, ...)
 *     or impossible per-resource (no create/edit/delete capability).
 *
 * Both files embed TC ids inside a **spec title comment** so board-sync's
 * scanner (`TC_ID_RE` over *.spec.ts) picks them up. Regenerate after board
 * or fixture changes; the generated files are committed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const E2E_DIR = dirname(HERE);
const CACHE = join(HERE, '.board-cache.json');
const RESOURCES = join(E2E_DIR, 'fixtures', 'rxsoft-resources.ts');
const COVERED_OUT = join(E2E_DIR, 'crud-suite', 'tc-covered.generated.ts');
const GATED_OUT = join(E2E_DIR, 'crud-suite', 'tc-gated.generated.ts');
const SUITE_SPEC = 'crud-suite/run-crud.spec.ts';

/** Board TC name keywords → capability the crud-suite actually exercises. */
const CAPABILITY_BY_NAME = [
  [/list renders|renders/i, 'render'],
  [/column sort/i, 'sort'],
  [/search/i, 'search'],
  [/paginat/i, 'pagination'],
  [/create/i, 'create'],
  [/edit|update/i, 'edit'],
  [/delete|archive/i, 'delete'],
  [/export csv/i, 'export'],
];

/**
 * Capabilities the suite can SKIP per-resource (mirrors test.skip in
 * run-crud.spec.ts driven by the fixture flags). Board TCs of these kinds on
 * a resource whose flag is false are emitted as `gated`. Every other test
 * type (column sort, validation/cancel branches, PDF, error handling,
 * accessibility, permissions) is NOT emitted at all — it stays `missing` on
 * the tracker until a later phase genuinely implements it.
 */
const SKIPPABLE_CAPS = new Set(['create', 'edit', 'delete', 'export']);

if (!existsSync(CACHE)) {
  console.error('gen-tc-coverage: .board-cache.json missing — run `node board-sync.mjs` first.');
  process.exit(1);
}

const cache = JSON.parse(readFileSync(CACHE, 'utf-8'));
const items = cache.items ?? [];

/** Entity names of interest: only [rxsoft] entities implemented by the suite. */
const RXSOFT_ENTITIES = new Map(); // lower entity name → { prefix, ucs: [body] }
const UC_RE = /\*\*(TC-RX-[A-Z0-9-]+-\d+)\*\* — (.+)/g;

for (const it of items) {
  const body = (it.content ?? {}).body ?? '';
  if (!body || !it.title?.startsWith('UC-RX-')) continue;
  for (const m of body.matchAll(UC_RE)) {
    const tcId = m[1];
    const name = m[2].trim();
    // tcId form: TC-RX-<ENTITY>-<NN>; entity may contain hyphens → strip NN
    const withoutPrefix = tcId.replace(/^TC-RX-/, '');
    const nn = Number(withoutPrefix.split('-').pop());
    const entity = withoutPrefix.slice(0, withoutPrefix.length - String(nn).length - 1).toLowerCase();
    if (!RXSOFT_ENTITIES.has(entity)) RXSOFT_ENTITIES.set(entity, { ucs: [] });
    RXSOFT_ENTITIES.get(entity).ucs.push({ tcId, name, nn, body });
  }
}

/** Fixture registry (text) → per-resource capability flags. */
const regText = readFileSync(RESOURCES, 'utf-8');
const flag = (entry, name) => /can\w+/.test(name) ? Boolean(entry.match(new RegExp(`${name}:\\s*true`))) : false;

const resources = [];
for (const m of regText.matchAll(/id:\s*'([a-z0-9-]+)'[\s\S]*?canCreate:\s*(true|false)[\s\S]*?canEdit:\s*(true|false)[\s\S]*?canDelete:\s*(true|false)[\s\S]*?hasExport:\s*(true|false)/g)) {
  resources.push({
    id: m[1],
    canCreate: m[2] === 'true',
    canEdit: m[3] === 'true',
    canDelete: m[4] === 'true',
    hasExport: m[5] === 'true',
  });
}
void flag;

/** Entity name → fixture resource id (normalising board plurals/aliases). */
const ALIAS = new Map([
  ['chart of accounts', 'gl-accounts'],
  ['website orders', 'website-orders'],
  ['website prescriptions', 'website-prescriptions'],
  ['drug formularies', 'drug-formularies'],
  ['drug components', 'drug-components'],
  ['payment methods', 'payment-methods'],
  ['stock locations', 'stock-locations'],
  ['sales lines', 'sales-lines'],
  ['goods receiving', 'receiving'],
  ['inventory', 'inventory-movements'],
  ['audit logs', 'audit-logs'],
  ['uom categories', 'uom-category'],
]);

function resourceFor(entity) {
  const norm = ALIAS.get(entity) ?? entity;
  return resources.find((r) => r.id === norm);
}

/** Which capability a TC name implies (null = not asserted by the suite). */
function capabilityOf(name) {
  for (const [re, cap] of CAPABILITY_BY_NAME) if (re.test(name)) return cap;
  return null;
}

const covered = new Set();
const gated = new Set();

for (const [entity, { ucs }] of RXSOFT_ENTITIES) {
  const res = resourceFor(entity);
  // Entities outside the phase-1 fixture registry (phase 2/3 scope) are not
  // emitted at all — they must remain `missing`, never auto-gated.
  if (!res) continue;
  for (const { tcId, name } of ucs) {
    const cap = capabilityOf(name);
    if (!cap) continue; // test type the suite doesn't implement → missing
    const capable =
      (cap === 'create' && res.canCreate) ||
      (cap === 'edit' && res.canEdit) ||
      (cap === 'delete' && res.canDelete) ||
      (cap === 'export' && res.hasExport) ||
      // The suite asserts render, search and the pagination shell for every
      // resource; column sort is NOT asserted (no header click) → missing.
      cap === 'render' || cap === 'search' || cap === 'pagination';
    if (capable) {
      covered.add(tcId);
    } else if (SKIPPABLE_CAPS.has(cap)) {
      // Resource flag is false → run-crud.spec.ts test.skip — honest gate.
      gated.add(tcId);
    }
    // incapable non-skippable caps (sort) fall through → missing
  }
}

/** Title comment must embed every id on one line each so the scanner sees them. */
function render(fileComment, ids) {
  const sorted = [...ids].sort();
  const lines = sorted.map((id) => `//   ${id}`).join('\n');
  return `${fileComment}

// ${sorted.length} TC ids exercised or gated by ${SUITE_SPEC}.
// Board-sync scans this file (TC id per comment line) as coverage evidence.
${lines}
`;
}

writeFileSync(
  COVERED_OUT,
  render(
    `/**\n * GENERATED by tracker/gen-tc-coverage.mjs — do not edit by hand.\n *\n * TC ids the parameterized crud-suite asserts for phase-1 resources, given\n * each resource's capabilities in fixtures/rxsoft-resources.ts.\n */`,
    covered,
  ),
);if (gated.size > 0) {
  writeFileSync(
    GATED_OUT,
    render(
      `/**\n * GENERATED by tracker/gen-tc-coverage.mjs — do not edit by hand.\n *\n * TC ids the crud-suite would otherwise run but SKIPS via test.skip because\n * the fixture registry disables that capability for the resource\n * (canCreate/canEdit/canDelete/hasExport false). Nothing else is gated:\n * unimplemented test types stay missing until later phases.\n */`,
    gated,
  ),
  );
} else if (existsSync(GATED_OUT)) {
  writeFileSync(GATED_OUT, `/** GENERATED — no capability gates in the fixture registry. */\n`);
}

console.log(`gen-tc-coverage: entities=${RXSOFT_ENTITIES.size} covered=${covered.size} gated=${gated.size}`);
console.log(`  wrote ${relative(E2E_DIR, COVERED_OUT)} and ${relative(E2E_DIR, GATED_OUT)}`);
