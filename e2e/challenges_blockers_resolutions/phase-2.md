# Phase 2 — Items wizard (Add Item multi-tab create/edit)

Covers UC-RX-ITEMS-01…06 (TC-RX-ITEMS-01…16, 22, 23) via
`e2e/tests/rxsoft/items-wizard.spec.ts` (18 tests) against the full-page
create wizard at `/rxsoft/items/create` and the inline edit modal.

Final verification run: pw-2o — **17 passed / 0 failed / 1 honest skip**
(TC-03 pagination self-skips only if the catalog were empty) / TC-09
passed-flaky under momentary load.

## C1 — "New" does NOT open a modal: it navigates to a full-page wizard
- **Challenge**: every list-page resource so far opened a `ModalDataForm`;
  the suite (and its page object) assumed `[role="dialog"]`. On Items the
  New click silently navigated to `/rxsoft/items/create`
  (`itemsConfig.createPathBuilder`), so the modal wait timed out and a
  serial block aborted the remaining tests.
- **Resolution**: diagnosed with a never-throwing probe spec that dumped
  URL/DOM/console after the click (the throwing version died on a locator
  before printing anything). Spec rewritten around the page wizard; the
  page object gained a `scope: 'dialog' | 'page'` option so `fillField`
  works in both contexts.
- **Learning**: build the diagnostic tool so it cannot fail before it
  reports; check `createPathBuilder`/`editPathBuilder` in the resource
  schema before assuming modal semantics.

## C2 — The create page renders MORE required fields than the schema marks
- **Challenge**: schema marks only Category / Item Name / Base UOM
  `required: true`, but the create page shows stars on Generic Product,
  Purchase UOM, Sale UOM too — and a save attempt with any of them empty
  produces **no DOM error and no POST**: the form just quietly refuses.
- **Resolution**: fill every starred field and assert the quiet-refusal
  behaviour (still on step 1, tabs stay locked) instead of an error text
  that does not exist. Generic Product is confirmed optional by the
  CreateItemDto comment — its star is cosmetic — and fresh orgs may have
  no generic products to pick, so it is left empty.
- **Learning**: "required" in the UI ≠ `required` in the schema file; and
  quiet validation means the assertion target is behaviour (no navigation,
  no save), not a message.

## C3 — async-selects: label lookups flaky, `input[role="combobox"]` absent
- **Challenge**: the async-field renders a Mantine `Combobox` over
  `InputBase` — no `role="combobox"` on the page at all, and label-text
  proximity lookups broke on duplicate/hidden labels.
- **Resolution**: the component exposes `data-testid="async-select-<field>"`;
  locate by field name (`category`, `baseUom`, `purchaseUom`, `saleUom`).
  Options detach mid-click while the query debounces (re-render churn) —
  the picker re-fills and retries up to 3× (same pattern as the phase-1
  confirm-delete retry).
- **Learning**: prefer the component's own testids over structural
  lookups; Mantine Combobox + async queries need detach-tolerant clicks.

## C4 — Serial mode + retries re-run the WHOLE group per retry pass
- **Challenge**: with `describe.configure({ mode: 'serial' })`, a failing
  test's retry re-runs the group from test #1 — each pass burning ~8 min
  and surfacing a *different* timeout each time (TC-11, then TC-09, then
  TC-10) while machine load spiked (load-avg 216 vs 9 later).
- **Resolution**: 120s per-test budget in `beforeEach` (mirrors the
  crud-suite delete tests), a direct-navigation fallback in
  `openCreatePage` when the New click is swallowed, and retry-tolerant
  pickers. Final run went green on pass 1 modulo one flaky TC.
- **Learning**: on a loaded dev box, budget for the load you have; keep
  each test self-contained (open your own modal, re-search your own row)
  because serial retries reset group state.

## C5 — Created rows are invisible on page 1 of a 39k-row catalog
- **Challenge**: `GET /items?includeAll=true` returns the full global
  catalog paginated at 10 rows — the just-created item is never on page 1,
  so a naive `getRow` assertion fails despite a successful save.
- **Resolution**: search first (`crud.search(token)`), then assert the
  row — the same pattern the crud-suite uses.
- **Learning**: assert list membership through the list's own narrowing
  mechanism, not raw pagination luck.

## C6 — The board "0/N" counters only move when UC sub-issues CLOSE
- **Challenge**: the 62 checked TC boxes from phase 1 never changed the
  project card counters — cards count closed sub-issues, so unticked
  Items UCs kept every row at 0/N and hid real progress.
- **Resolution**: finish the spec to genuinely green, then run
  `board-sync --update-issues` so UC-RX-ITEMS-01…05 sub-issues close in
  the same write-back that ticks their TCs. Never pre-tick boxes for
  unverified TCs (C12 honesty rule from phase 1 still applies).
- **Learning**: pick the *unit of progress visible to stakeholders* and
  drive the suite toward completing whole units, not scattered checks.

## C7 — Vite dev-server watch storm: Playwright artifacts reload the page mid-run
- **Challenge**: the `webServer.command: 'yarn dev --host'` vite dev server is
  the same process the suite drives, and it watched the whole frontend tree
  including `e2e/reports/` (the html reporter `outputFolder`). Every artifact
  write fired a full HMR page reload on connected clients, killing in-flight
  navigations — systematic `page.goto` timeouts at 12–15 min of a run (runs
  4c14/4c15), with retries passing in ~20 s once the writes paused. In serial
  mode each failure cascaded into skips (21 of 26 tests "did not run" in 4c15).
  Reproduced by writing to `e2e/reports/index.html` while the dev server ran and
  observing `[vite] page reload e2e/reports/index.html`.
- **Resolution**: (1) `vite.config.mjs` → `server.watch.ignored` excludes
  `**/e2e/reports/**`, `**/test-results/**`, `**/playwright-report/**` (plus the
  `**/node_modules/**` / `**/.git/**` Vite already defaults, made explicit).
  Re-probed: identical writes now produce no event, while `index.html` /
  `src/main.tsx` still reload (watcher not disabled). (2) Playwright's
  `outputDir` (traces / screenshots / `.last-run.json`) moved outside the repo
  root to `os.tmpdir()/rxsoft-e2e-artifacts`, overridable via
  `PLAYWRIGHT_OUTPUT_DIR`. Vite 8's own `resolveChokidarOptions` already ignored
  `**/test-results/**` and `<outDir>/**` — `e2e/reports` was the only hole.
- **Learning**: any directory the harness writes into during a run is a
  hot-reload trigger for the server it started. Verify by touching the path with
  the dev server up and grepping its log for `page reload`, rather than assuming
  the ignore list covers it.
