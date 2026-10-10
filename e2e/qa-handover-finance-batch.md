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
