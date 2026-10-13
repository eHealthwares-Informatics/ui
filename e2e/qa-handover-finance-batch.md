# QA handover — Finance batch close-out (2026-10-10) → Scrum master

**Read this even if you read the earlier draft**: the batch progressed past the
previous handover — #778 was fixed, verified and closed in-session. Nothing
from the finance cluster remains open. Your queue is only the items in
**§2**.

## §0 · TL;DR

- **Phase-4 finance cluster: 100% complete.** 7/7 entity issues closed, epic #5
  Done, tracker rollup shows Dashboard 2/2, Reports 2/2, Trial Balance 3/3,
  Balance Sheet 3/3, Income Statement 3/3, Sales Analytics 12/12, Purchases
  Analytics 12/12 (✅ all).
- **Backend defect found → fixed → verified same-day**: ehealthwares/rxsoft#778
  (CSV exports streamed 0-byte files for zero-row orgs) — fixed by
  eHealthwares-Informatics/rxsoft PR #51 (`toCsv(rows, columns?)` always emits
  a header row), verified green on a fresh org, issue closed with evidence.
- Everything is pushed: frontend `master@539ec04`; the QA box is synced and
  clean.

## §1 · Batch record (for audit, no action needed)

| What | Where / evidence |
|---|---|
| Specs (37 board TCs) | `e2e/tests/rxsoft/{dashboard,reports,financial-statements,sales-analytics,purchases-analytics}.spec.ts` |
| Runs | QA-system logs `/tmp/pw-qa-finance.log` (full 49.6m), `pw-qa-rerun5.log`, `pw-qa-csv2.log`, `pw-qa-778verify.log` (final 5/5 first-try) |
| Green TCs ticked | 37 total: 13 statement/dashboard/report TCs + 22 analytics TCs + 2 TC-21s after the #778 fix (35 + 2) |
| Design gates (NOT ticked, C12) | TC-02/03/06/07/08 ×2 — chart dashboards ship no sort/pagination/search/debounce; skip gates with reasons live in the two analytics specs; gate UCs #202 #203 #207 #208 closed with explanatory comments |
| UC sub-issues closed | #192 #194 #196 #198 #200 #202–#205 #207–#210 (13) |
| Entity issues closed | #191 #193 #195 #197 #199 #201 #206 — evidence comments + acceptance boxes ticked + tracker Status=Done (verified via `gh project item-list`) |
| Epic | #5 Status=Done (verified) |
| #778 | Filed (root cause `toCsv` empty-input → `''`), fixed (PR #51), verified (TC-*-21 auto-unskip, 28.7s/28.9s), ticked + closed |
| Coverage | 17.8% → 19.6% of mappable TCs (262 covered + 149 gated / 2101); phase-4 missing 142 → 105 |
| Averted regression | board-sync wanted to untick TC-RX-PURCHASES-UNPOST-03 on closed #115 — coverage existed, the id had dropped out of the receiving.spec.ts title in an earlier rename; fixed in `receiving.spec.ts` |
| Queue log | `e2e/board_updates.md` — all finance-batch rows marked **Done** (applied 2026-10-10) with evidence |
| Commits | `31b83d4` (specs + #778 gates) → `f4155e3` (board write-back + this handover) → `0d060b8` (queue rows applied) → `539ec04` (#778 verified + entities closed) |

## §2 · Your queue (pending actions, in priority order)

1. **Oct-7 sort-tick rows (~25 × TC-02, crud-suite entities)** — still Queued
   in `board_updates.md`, never applied. The green-run evidence lived in local
   `/tmp` which the 2026-10-10 reboot wiped. Re-verify with a fresh
   `--grep "column sort"` run on the QA box before ticking (C12).
   - *Scrum-master 2026-10-10: re-verification run launched on the QA box
   (log `/tmp/pw-qa-sort-20261010b.log`); ticks will be applied on green
   evidence.*
2. **Leftover E2E orgs on the QA system** — `E2E-20261010-PU5E3C`,
   `E2E-20261010-T4HYQU`, `E2E-20261010-VZ6ITQ` (all seed#12 teardown
   timeouts). Cleanup runbook: `e2e/orphaned-org-cleanup.md`.
   - *Scrum-master 2026-10-10: ✅ DONE. All 3 cleaned per runbook §4 (the
   three `lot_id` indexes already existed from the 2026-10-10 manual fix, so
   none were recreated). Scoped deletes: `stock_lots` 29,448 + 14,448 rows
   (batched 5,000/statement), `gl_accounts` 27 rows, identity `organizations`
   3 rows; no `audit_logs` rows present. All 3 verified `exists:false` on
   seed :8094 after cleanup.*
3. **#774 gap work continues** (the issue stays open as the standing
   coverage follow-up). Biggest remaining buckets, in rough value order:
   - Phase-4 missing 105 TCs (website orders/prescriptions partials, org
     payment providers, products, purchases, journal entry lines, user
     config/insights, org config, reset password, settings, dashboard/reports
     leftovers are now done).
   - Phase-1/2/3 #774 gaps: empty-state TCs (list endpoints that ignore
     `search`), search clear/debounce residue, create validation/cleanup,
     error-handling UCs; #180 TC-15 still needs backend `PATCH /roles/:id`.
   - Phase-5 modules: 1251 TCs at 0% — LIS :8002/:8091, EMR, communication,
     ehealthwares — services down on both boxes; needs a bring-up decision
     before any of it is mappable.
4. **ui#102 verification** — Vite-reload-storm fix merged via PR #103
   (artifacts moved out-of-tree + runbook). Verify it holds on the next long
   multi-spec run.
5. **Tracker cadence** — `node e2e/tracker/board-sync.mjs --no-cache` after
   any spec/board change. Its `--update-issues` still wants to tick the 10
   analytics design-gate TCs and `--set-status` still proposes #201/#206:
   **deliberately do not apply those** — the surgical, C12-honest state on the
   board is the correct one (gates documented, unticked).

## §3 · Ops notes for whoever runs next

- **QA box**: `ssh uzo-qa` (key auth configured from the local box;
  `uzo@192.168.1.209`). Node is NOT on the default SSH PATH:
  `export PATH=$HOME/.nvm/versions/node/v24.14.0/bin:$PATH`. **No gh CLI on
  the box** — all board/GitHub writes happen from the local machine with
  `gh auth switch -u ehealthwares` + identity guard first.
- **Services there**: rxsoft :8080 (`nest start --watch` — git pull
  auto-rebuilds; verify `/api/health` 200 after ~75s), identity :8092, seed
  :8094, vite :5173, Postgres :5432. EMR :8093 down (not needed by this
  batch).
- **Run command** (QA box): `cd ~/develop/rxsoft/frontend && npx playwright
  test --config e2e/playwright.config.ts --project=setup --project=admin
  <specs> --retries=1 --reporter=list` — launch detached (`nohup … > /tmp/x.log
  2>&1 &`) and poll the log; sync SSH calls time out.
- **Cold-Vite flake pattern**: every route's first test attempt after a fresh
  provision pays a ~4–6 min dev-server transform (goto timeout) and passes on
  retry in ~15–35s. Retries=1 absorbs it. Pre-warm via curl if you want
  first-try greens. Do not "fix" specs for this.
- **Mantine DatePickerInput**: control is a `<button>` (label→button
  association); calendar day buttons are accessible-named as full dates
  (`"1 October 2026"`) — see `pickDatePickerDay` in financial-statements.spec.ts.
- **Blob downloads**: never read export contents via `download.path()` for
  the anchor-blob exports — fetch the endpoint in-page instead (TC-21 tests).
- **Backend-defect gate pattern**: for a verified backend defect, gate the
  test `skip-if-empty`-style on the defect issue id — it documents the gap,
  keeps suites green, and **auto-covers when the fix lands** (this is exactly
  how #778 resolved itself in-suite).
- **Known repo quirk**: an external automation occasionally auto-commits the
  frontend working tree (it did during this batch) and `src/routeTree.gen.ts`
  is perpetually dirtied by the running vite — stash it before pulls.

## §4 · Scrum-master close-out (2026-10-10)

- **§2.2 orphaned orgs: ✅ cleaned** — see annotation under §2 item 2.
- **§2.1 sort-tick rows: re-verification in flight** — fresh
  `--grep "column sort"` run launched on the QA box; the ~25 queued TC-02
  ticks will be applied on green evidence, then `board-sync.mjs --no-cache`
  regen captures the coverage delta in one pass (§2.5).
- **§2.3 #774: no action** — standing coverage follow-up; stays open.
- **§2.4 ui#102: no action** — verify on the next long multi-spec run.
- Handover doc itself: updated this session (this §4 + §2 annotations);
  changes are uncommitted in the frontend tree.

## §5 · Multi-session log (2026-10-10 → 2026-10-13) — supersedes §4 staleness

Written by the QA agent at 2026-10-13 via a master worktree (the frontend
checkout is shared with parallel sessions — use `git worktree add <tmp>
origin/master` for coordination commits; do NOT switch branches or reset).

### Queue items resolved since §4
- **§2.1 sort-tick rows: ✅ DONE** — the scrum master re-ran the sort suite
  green (37p/2s, `/tmp/pw-qa-sort-20261010b.log`) and applied all 25 TC-02
  ticks; QA agent verified no duplicates.
- **§2.2 orphaned orgs: ✅ cleaned** (scrum master; scoped deletes, verified).
- **#778: ✅ verified + closed** — backend PR #51 (toCsv header row) landed;
  TC-RX-{SALES,PURCHASES}-ANALYTICS-21 auto-unskipped and passed first-try
  (28.7s/28.9s, `/tmp/pw-qa-778verify.log`); UCs #204/#209 closed, entities
  #201/#206 closed + Status=Done, epic #5 Done. Finance cluster 100% closed.

### Phase-4 ticket batch B (QA agent, landed in `a5a65e9`)
- New registry entries: **Purchases** (#104) + **Organisation Payment
  Providers** (#149), view-only.
- New specs: `tests/auth/reset-password.spec.ts` (#318 — **both TCs green
  first-try**), `tests/rxsoft/journal-entry-lines.spec.ts` (#299 — TC-23
  keyboard green; TC-01/02/03 honest-skip on fresh orgs: no journal entries
  ship with seed), `tests/rxsoft/org-user-config.spec.ts` (#221/#240),
  `tests/rxsoft/settings.spec.ts` extended (#316: TC-01 green flaky-retry).
- **Known open spec issues (first-run failures, fixes superseded by the
  4c18/4c19 alignment session's `d84a724`)**: settings TC-02/03/04 asserted
  `page-title` testids but the section pages render the app settings layout
  (h1 "Settings" + **h3 section headings**); user-config/org-config land on a
  **picker first** ("Select an organisation above to configure it") — form
  fields don't mount until an option is picked. If 4c18/4c19 coverage still
  fails on these, re-apply the QA agent's fixes (h3-heading assertions +
  `ensureFormMounted()` picker step).

### TC-*-04 (empty state) — full matrix verified on the QA box (2026-10-13)
Evidence: `/tmp/pw-qa-tc04-tail.log` (14p/3s/3.8m) + the parallel session's
541-test `pw-validate.log` + `/tmp/pw-qa-tc04-sweep.log`.
- **GREEN ≈25 resources** (Manufacturers, Price Lists, UOMs, Pharmaceutics,
  Drug Components, Warehouses, Audit Logs, Payment Methods, GL Accounts,
  Journals, Organizations, Stock Locations, Purchases, Journal Entries,
  Users, Sales, Sales Lines, Products Prices, Items, Prescriptions, Goods
  Receiving, Inventory, Categories, Customers, Suppliers).
- **Honest gates ≈10** (search-ignoring endpoints — the skip branch fires):
  Payment/Insurance Providers, POS Terminals, Payments, Payment
  Transactions, Receivables, Orders, Branches, Roles, Org Payment
  Providers. **0 failures.** This is PR #126's TC-04 re-enable validation.

### ⛔ Blockers / flags
- **POS Terminals create is red on the QA box branch** (old `'Provider'`
  field label; the `'Provider Type'` fix sits on unmerged
  `feat/10-select-testids`). It poisons the whole POS describe (serial
  chain skips after it). **Merge that fix.**
- **12× "renders the list page" failures + others in the killed 541-test
  run tail** were environmental (services restarted mid-run by another
  session); the resources pass in isolation.
- **EMR coverage: 0/360 TCs visible** — review + plan posted on
  ehealthwares/rxsoft#10 (TC-id visibility win ≈30 TCs; mock-backed EMR
  crud-suite runner ≈+150; flow completions).

### Ops notes (updated)
- **QA box relocated to 192.168.1.230** — `~/.ssh/config` alias `uzo-qa`
  updated. Same host (JohnTheBeloved-MacBookPro), services on
  8080/8092/8094/5173/5432; LIS :8002 now up too.
- **Runs keep getting killed ~10min in on the new box** (no cron/watchdog
  found — looks like macOS memory-pressure kills). **Workaround: small
  grep-scoped batches finish cleanly** (see the 3.8m tail sweep).
- **Tracker policy change (scrum master, `ec5e7ac`)**: operational
  (capability) gates no longer satisfy UC completion — gate TCs are
  reported separately; re-read board-sync before future write-backs.
- Serial discipline: other sessions run on the box — always check
  `ps aux | grep playwright` and yield; never reset the tree under a live
  run (it reverts uncommitted work — an incident on 2026-10-10 20:13 cost
  8 src files of uncommitted work on the box).

## §6 · QA agent log (2026-10-13 evening) — price-adjustment spec + PR coverage audit

### New spec: Price Adjustment History (rxsoft#68 + ui#133)
- `e2e/tests/rxsoft/price-adjustment-history.spec.ts` (master@69e765c) —
  6 tests for `/rxsoft/price-adjustments`: page render (filter card +
  7-column table + count), empty state (mocked zero page), **#68 display-name
  enrichment** (mocked rows: itemName/itemCode/priceListName, NGN money
  window, ±delta badges, reason, By=user slice(8)), filter params reach the
  API (priceListId + fromDate via picker), `?itemId` deep-link + Clear
  reset, pagination (total=45 → Mantine Pagination → page=2 request).
- Run status: blocked earlier by box saturation; spec + the 3 feature src
  files were **surgically staged from master onto the box branch**
  (`git checkout origin/master -- <paths>` — no branch switch, no disruption
  to the parallel sessions' dirty trees) and a run launched once load fell
  below 10. Restore plan after the run: `rm -rf` the two new src dirs +
  `git checkout HEAD -- src/features/rxsoft/pages/index.ts`; the spec file
  `git restore --staged` + delete; routeTree regenerates via the vite plugin.
- **Backend #68 is live on the box** (nest watch recompiled it: box backend
  at 9d7c0ea includes bd1186e).

### Merged-UI-PR coverage audit (evidence greps on origin/master)
- ✅ Covered: #122 (rowAction → whole crud-suite), #123 (TC-22 error tests,
  green in the 10-13 validation run), #125 (wizard row-save tests),
  #127 (owner gates + route edit), #128 (runner edit tests), #130 (forms
  testids consumed by tests/emr/forms.spec.ts), #132/#134 (LIS suites ARE
  the specs), #133 (this section's new spec).
- ⚠️ Partial: #126 (TC-04 matrix verified 25-green/10-gates; **POS Terminals
  create still red** pending merge of the `'Provider Type'` fix on
  `feat/10-select-testids` — poisons the POS describe), #129 (storefront
  redirect asserts exist; payments-specific redirect untested), #131
  (notifications section renders — **the SRS 7.9 switches untested**).
- ❌ Gap: **#135 SEO/PWA shell** (robots.txt, manifest, OG, JSON-LD — zero
  e2e references).

### Open QA issues vs existing coverage
- **ui#63** (offline walk-in, PR #62): pos.spec tests 9+10 (walk-in queue,
  business-error block) + online regression 11–17 ✓; **gap: ask-3
  sync-after-reconnect**. Issue says "stays in Todo until picked up".
- **ui#39** (POS batch #33–#38): pos.spec tests 1/3/5/6/7/8 ✓; tests 2 (#34
  placeholders) + 4 (#36 X-clears) are documented honest skips (headless
  timing). Emzor priority (backend #12) = test 7 ✓.
- **ui#61** (PR #60 batch): form validation VAL-01/02 ✓, loading-screen ✓,
  priceListId ✓ (pos.spec 3); **gaps: forgot/verify-email website auth
  paths (my reset-password spec covers form+mismatch only) and
  coupons/consultations/delivery-areas admin CRUD (not in the crud
  registry)**.

### Recommended next specs (cheap → valuable)
1. SEO/PWA static-route assertions (robots.txt 200 + sitemap link,
   manifest.json fields, OG/JSON-LD meta) — closes the #135 gap.
2. Notification-switch toggle behaviour (#131) — settings/display or
   notifications section toggle + PATCH assertion.
3. ui#63 sync-after-reconnect (re-enable network → queued sale syncs with
   original saleNumber).
4. Website auth forgot/verify-email paths + admin website CRUD registry
   entries (ui#61 leftovers).

### Box ops (evening)
- Saturation pattern: parallel sessions pushed load to 30–90; two of my
  runs were killed mid-flight. **Rule that worked: poll `uptime` until <10,
  launch immediately, prefer small grep-scoped runs.**
- Parallel-session artifacts observed: `fe_vitest_serial2.log` (vitest on
  `fix/68-testid-enforcement`), `ci_watch.log` (GH Actions watcher for
  ui#136). No Playwright suite was running at 20:00; load back to ~5.

### §6 addendum — price-adjustment spec run outcome (2026-10-13 20:20)
- Run `/tmp/pw-qa-pah2.log` (box load settled to <10): **4 passed / 3 failed**.
  - ✅ pass: page render, empty state, **#68 enrichment rendering**
    (screenshot proof: Paracetamol/PCM, Retail, NGN money window, ±Δ
    badges, reason, By-slice — the UI half of #68 is sound), auth setup.
  - ❌ fail: the 3 live-API tests — **backend defect: GET /price-adjustments
    500s on EVERY request** (7×500 / 0×200 in the rxsoft log), incl. the
    unfiltered base call. TypeORM `databaseName` TypeError in
    `createOrderByCombinedWithSelectExpression` from
    `PricingService.listPriceAdjustments` (pricing.service.ts:113) — the
    #68 enrichment rewrite lost the orderBy alias. Filed as
    **ehealthwares/rxsoft#786** with stack trace, repro matrix, and the
    unit-suite gap note (jest mocks the QB → needs a DB-backed integration
    test). The 3 tests auto-cover on fix (same pattern as #778).
  - ❌ fail (spec bug, fixed): pagination test assumed Mantine v9 Pagination
    exposes `aria-label="pagination"` nav — it does not; fixed to
    `.mantine-Pagination-root` (master@89ac5d7). Failure screenshot proved
    the mock + footer + page buttons all render — only the locator was wrong.
- Box staging files cleaned up (rm of the 3 src additions + spec; pages/index.ts
  restored; routeTree regenerates); LIS session's dirty tree untouched.

### Defect register (QA agent, 2026-10-13 evening)
| Ticket | Defect | Evidence | Status |
|---|---|---|---|
| [rxsoft#786](https://github.com/ehealthwares/rxsoft/issues/786) | `GET /price-adjustments` 500s on EVERY request (TypeORM orderBy alias lost in the #68 enrichment rewrite; unit suite mocks the query builder so it passed) | rxsoft :8080 log stacks, 7×500/0×200 across the pah spec run; pah spec's 3 live tests auto-cover on fix | OPEN — blocks ui#133's live data |
| [rxsoft#787](https://github.com/ehealthwares/rxsoft/issues/787) | 10 list endpoints ignore the `search` param (no-match search leaves all rows) — TC-04 gates fire for Payment/Insurance Providers, POS Terminals, Payments, Payment Transactions, Receivables, Orders, Branches, Roles, Org Payment Providers | TC-04 matrix run (`/tmp/pw-qa-tc04-tail.log`, `pw-validate.log`); 25 other endpoints honor search green the same day | OPEN — policy-elevated: gates now block UC completion (`ec5e7ac`) |

Non-defect flags (tracked in §5/§6, no ticket): POS Terminals create red pending merge of `feat/10-select-testids` (`'Provider Type'` label fix); QA-box ~10-min run kills under load (ops pattern, workaround documented).
