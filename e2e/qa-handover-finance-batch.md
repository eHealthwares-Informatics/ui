# QA handover — Finance batch (2026-10-10) → Scrum master

**Batch**: Phase-4 finance cluster e2e coverage — issues #191 #193 #195 #197 #199 #201 #206 (37 board TCs).
**Specs**: `e2e/tests/rxsoft/{dashboard,reports,financial-statements,sales-analytics,purchases-analytics}.spec.ts` — landed on `master` as `frontend@31b83d4` (+ `31b83d4` includes the board_updates queue rows; the UNPOST-03 title fix rides along in the same commit).
**Environment**: everything ran on the QA system (`ssh uzo-qa`, user uzo@192.168.1.209, key auth from the local box; node via `~/.nvm/versions/node/v24.14.0/bin` on PATH — NOT on the default SSH PATH). Logs live there in `/tmp`: `pw-qa-finance.log` (full 49.6m run), `pw-qa-rerun5.log`, `pw-qa-csv.log`, `pw-qa-csv2.log`. The QA box has **no gh CLI** — all board writes happen from the local box.

## Board state after this batch (all applied 2026-10-10)

| Action | Where | Result |
|---|---|---|
| 35 verified-green TCs ticked | UC bodies #192–#210 | ✔ only green TCs; gates deliberately unticked (C12) |
| UCs closed complete | #192 #194 #196 #198 #200 #205 #210 | ✔ `--reason completed` |
| Gate/defect evidence comments | #202 #203 #204 #207 #208 #209 | ✔ design gates + #778 links |
| Entity issues closed complete | #191 #193 #195 #197 #199 | ✔ evidence tables + acceptance boxes ticked |
| Entity issues kept open | #201 #206 | ✔ comments: 16/24 green, TC-21 → #778, design gates |
| Board Status=Done | #191 #193 #195 #197 #199 + epic #5 | ✔ verified via item-list |
| Coverage comment | #774 (comment 6101120990) | ✔ tracker 17.8% → 19.6% |
| Defect filed | **ehealthwares/rxsoft#778** — CSV export endpoints stream 0-byte files (`toCsv` no header row) | ✔ acceptance = header row always; e2e auto-covers |

## Pending for scrum master (queue rows in board_updates.md)

1. **2026-10-07 sort-tick rows (~25 × TC-02)** — still Queued, never applied. The green-run evidence lived in local `/tmp` which the 2026-10-10 reboot wiped. Re-verify with a fresh `--grep "column sort"` run before ticking (C12).
2. **#778 backend fix** → when merged, re-run `sales-analytics.spec.ts` + `purchases-analytics.spec.ts` on a fresh org: TC-21 pair auto-unskips → tick TC-21 on #204/#209, then those UCs can close, and #201/#206 can complete (their remaining TC-02/03/06/07/08 are documented design gates — treat gates as satisfying the UC acceptance "spec or documented skip gate", or keep them open per your convention).
3. **Leftover E2E orgs on the QA system** — `E2E-20261010-PU5E3C` and `E2E-20261010-T4HYQU` (teardown seed#12 timeouts). Same cleanup runbook as `e2e/orphaned-org-cleanup.md`.
4. **Tracker cadence** — `node e2e/tracker/board-sync.mjs --no-cache` after any spec/board change; current state: 262 covered / 149 gated / 1690 missing, 19.6%.

## Operational notes for whoever runs next

- **Cold-Vite flake pattern on the QA box**: every route's first test attempt after a fresh provision pays a ~4–6 min dev-server transform (goto timeout) and passes on retry (~15–35 s). Pre-warm by curl-ing the routes once before the run if you want first-try greens. Retries=1 absorbs it; do not "fix" specs for this.
- **Mantine DatePickerInput**: control is a `<button>` (label→button association), day buttons are accessible-named as full dates (`"1 October 2026"`) — see `financial-statements.spec.ts` `pickDatePickerDay`.
- **Blob downloads**: don't read download file contents via `download.path()` for the anchor-blob exports — fetch the endpoint in-page instead (see the TC-21 tests).
- **Known open QA tracks**: #774 gap work continues (empty-state/search/cleanup/validation/error-handling UCs across crud entities); ui#102 (Vite reload storms) is merged via PR #103 docs/runbook — verify it holds on the next long run.
