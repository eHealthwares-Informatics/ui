# Playwright E2E — handover & status (read this first in a fresh session)

**Purpose**: Canonical onboarding for a fresh Freebuff session continuing the RxSoft alpha-test-coverage effort. Read top-to-bottom; everything linked is in-repo.
**Board**: ehealthwares/rxsoft → "RxSoft Alpha Test Plan" (22 epics / 116 entity tasks / 593 UCs / ~2,039 TCs)
**Last updated**: 2026-10-08 ~20:30 (§5.1 common-issues playbook added; earlier: 2026-10-01 validation gate + VAL family + efficiency fixes)

---

## 0. Orientation (30 seconds)

- You are continuing multi-phase Playwright coverage of the `frontend/` app against the rxsoft backend. Phases 0–2 are merged; phase 3 (operations) is next.
- Root [AGENTS.md](../../AGENTS.md) → **"Alpha QA workflow rules (always)"** are binding:
  1. testid-first selectors (label-proximity only as flagged fallback)
  2. UI visibly enforces schema+biz rules before submit; e2e asserts visible errors **and** zero POSTs
  3. board mutations go through [board_updates.md](board_updates.md) for the scrum-master agent — never ad hoc (explicit in-thread user request is the only exception)
  4. dead servers → output the quick-start block from [server_restart_command.md](server_restart_command.md) and **wait for the user**; never start daemons yourself
- Honesty rule (challenge C12): never tick a board box for an unverified TC.

---

## 1. Merged state (safe ground)

| Phase | Scope | Merged via |
|---|---|---|
| 0 — baseline | auth + session priming, public/admin shell specs | ui PR #2, #3; rxsoft PR #1 (PATCH /price-lists fix) |
| 1 — rxsoft CRUD registry | crud-suite runner over ModelConfig resources | phase-1 PRs |
| 2 — catalog: items wizard | 18 TCs (17 pass + 1 honest skip); UC sub-issues #29–33 closed; 20 gated delete-UCs closed | ui PR #4 (bc69fdf, merged 2026-09-28) |

Coverage after phase 2: ≈ **94 covered + 84 gated** of ~2,039 TCs (tracker snapshot: [TRACKER_STATUS.md](TRACKER_STATUS.md), generated 2026-09-28 — regenerate after the next merge).

## 2. Landed in this session — **UNCOMMITTED** (verify with `git status` first!)

### 2.1 frontend working tree (on `master`, all green: typecheck ✅ / lint 0 errors ✅ / vitest 75/75 ✅)

**Validation gate completed** (spec: [tasks/schema_validation_task.md](tasks/schema_validation_task.md) §8):
- [submit.ts](../src/features/components/form/submit.ts) — added exports `validateFields`, `renderValidationErrors`, `clearValidationErrors` (shared with the hook)
- [RenderField.tsx](../src/features/components/form/RenderField.tsx) — all 9 `field-error-<name>` spans render unconditionally (were `{fieldError && …}`, which made the gate's DOM-poked errors impossible on first failure)
- [data-page-form.tsx](../src/features/components/page/data-page-form.tsx) — outer Stack gets `className="rx-page-form"` (summary anchor for page forms, not just modals)
- [tab-groups.tsx](../src/features/components/form/tab-groups.tsx) — **step gate**: draft-creating transitions (tab-1 → `waitFor:'id'` tabs) validate the active tab and block the POST visibly. Scoped to draft transitions only — price/stock tabs' required fields don't block plain navigation. This closed the hole where wizard `Next` (Create & Continue) bypassed the zod gate entirely.

**VAL family** (new file, untracked): [tests/rxsoft/items-validation.spec.ts](tests/rxsoft/items-validation.spec.ts)
- VAL-01 empty submit → per-field errors + aria-invalid + focus + zero POSTs
- VAL-02 fix fields → errors clear + exactly one POST
- VAL-03 summary lists all three offending fields
- VAL-04 UI required set == `CreateItemDto` via `/api/docs-json` (skip-gated)

**E2E efficiency fixes** (make runs faster/less flaky):
- [__root.tsx](../src/routes/__root.tsx) — React Query Devtools hidden when `navigator.webdriver` (source fix for the `tsqd-` overlay); **14 `addStyleTag` hacks removed from 7 specs** (items-create, inventory-transfer/-adjust, receiving, purchases, full-business-flow, roles-permissions)
- [main.tsx](../src/main.tsx) — `retry: false` for queries in dev/e2e (fail fast, no backoff)
- [tab-groups.tsx](../src/features/components/form/tab-groups.tsx) — unsatisfied gated tabs stay **unmounted** (no doomed matrix loads per wizard open)
- [HeaderBar.tsx](../src/features/components/table/HeaderBar.tsx) — no-op search commits skipped (fewer refetches)
- [data-page-shell.tsx](../src/features/components/page/data-page-shell.tsx) — default page size 10 → 25

**Inventory testids + spec migration** ([tasks/data_test_id_task.md](tasks/data_test_id_task.md) audit row updated):
- [inventory/index.tsx](../src/features/rxsoft/pages/inventory/index.tsx) — `transfer-modal/-destination/-uom/-quantity/-submit`, `adjust-modal/-quantity/-reason/-submit`, `adjust-inline-form/-quantity/-reason/-submit`, `row-view-movements/-transfer/-adjust` (page has TWO "Post Adjustment" buttons — testids disambiguate)
- [inventory-adjust.spec.ts](tests/rxsoft/inventory-adjust.spec.ts) rewritten testid-first + fixed dead skip-check + one-POST guard; [inventory-transfer.spec.ts](tests/rxsoft/inventory-transfer.spec.ts) migrated (one scoped `getByRole('option')` remains — Mantine options need a `renderOption` refactor for testids)

**Docs**: this file, [board_updates.md](board_updates.md) (queue with 3 pending create-issue entries), task docs above.

### 2.2 rxsoft working tree (on branch `phase-1-pricing-patch`, which is also **1 commit ahead of origin**)

- **Recency sort (O1)**: dirty [typeorm-item.repository.ts](../../rxsoft/src/modules/catalog/repositories/typeorm-item.repository.ts) + spec + swagger.yml — default sort `createdAt DESC` (supports [tasks/item_creation_view.md](tasks/item_creation_view.md)). Needs commit + PR. The `sortBy: 'createdAt'` code path already existed; only the default flipped.

### 2.3 ⛔ DO NOT TOUCH — user's in-flight POS work (uncommitted)

- `src/features/shop/api/posApi.ts`, `src/features/shop/pos/components/ProductEntryTable.tsx` (modified), `src/features/shop/pos/components/QuickAddProductModal.tsx` (untracked)
- `HeldSalesDrawer.tsx` / `PosSettingsDrawer.tsx` have pre-existing format drift — **never run repo-wide `yarn format:write`**; format only your own files (`yarn oxfmt --write <paths>`).

## 3. Verification state & next actions (in order)

Verified: typecheck, lint, vitest 75/75, format (except §2.3 files).
**NOT yet run live** (identity/seed were down): VAL family, items-wizard regression (step-gate change!), inventory specs.

1. **Regression run** — user starts servers (§5), then run via dev-daemon:
   `items-validation.spec.ts` + `items-wizard.spec.ts` + `inventory-adjust/-transfer.spec.ts`
   (items-wizard MUST stay green after the step-gate + lazy-tabs changes.)
2. **Commit + PR** the frontend work (suggested: one branch `phase-3-prep` with validation-gate + VAL + efficiency + inventory testids, or split gate/perf).
3. **rxsoft O1**: commit recency sort, PR, merge → then REC-01 e2e assertion + remove TC-03 self-skip.
4. **Board**: apply the pending [board_updates.md](board_updates.md) rows (VAL epic, REC-01, testids issue) via the scrum-master flow; regenerate tracker ([../tracker/board-sync.mjs](tracker/board-sync.mjs)).
5. **Phase 3a** (§4 below).

## 4. Going forward — phase plan

- **Phase 3a — operations flows (~50 TCs)**: Purchases #104 (21), Receiving #111 (13, incl. receive→unpost w/ password `password12`), Inventory #86 (16, adjust/transfer). Starter specs are substantial; upgrade to full UC coverage (list/sort/paginate, search/filter, error handling) + testid-first. PO screen is already `po-*`-rich.
- **Phase 3b — ops CRUD (~87 TCs)**: Roles #176 (24), Role Requests #184, Suppliers #116, Stock Locations #92 — proven crud-suite pattern.
- **Phase 4 — commerce (~65 UCs)**: sales complete-sale #123, website orders #168 / prescriptions #172, receivables, Full Business Flow #211. Seed HTTP scenario (`cd seed && npm run seed -- --http`) is the fixture.
- **Phase 5 — modules (~360 UCs)**: LIS :8091 (the 1,251-TC whale — crud-suite template first, then 5-step order workflow #728), conversation :8090 (Mongo replica set), communication :8003, concepts :3011.
- **Phase 6 — hardening**: full matrix, retries, trace review, testid-audit spec in CI rotation.

## 5. Environment & machine quirks (this Mac)

**Servers** (user starts them — rule 4): quick-start block lives in [server_restart_command.md](server_restart_command.md). Ports: rxsoft :8080 (`/api` prefix) · identity :8092 · seed :8094 (`SEED_PORT`; EMR owns :8093) · vite :5173 (via dev-daemon). e2e provisions a fresh org per run via seed `POST /api/provision` (x-api-key from `seed/.env`); fallback DEFAULT org `admin`/`password` still needs identity up.

```bash
# the one Playwright invocation that works here (provisioned org):
cd frontend && KEY=$(grep '^SEED_API_KEY=' ../seed/.env | cut -d= -f2) && \
node e2e/tracker/dev-daemon.mjs --name pw-X --cwd "$PWD" --log /tmp/pw-X.log -- \
  env SEED_PROVISION_API_KEY="$KEY" npx playwright test --config e2e/playwright.config.ts \
  --project=setup --project=admin tests/rxsoft/<spec>.spec.ts --retries=1 --reporter=list
```

**Quirks that have actually bitten us:**
- Freebuff restarts kill all daemons + /tmp logs + preview registrations; restart everything from the doc above.
- "Local changes snapshot" writes files with mode **600** → the app's file tools may report `[BLOCKED]`/"file does not exist" on real files. Fix: `chmod 644 <file>` (bash can always read/write as owner). If `read_files` blocks *everything*, work through bash (`sed -n`, `cat`) + python edits with exact-match assertions.
- **Load trap**: check `uptime` before Playwright runs. Incident: load-avg 216 vs 9 normal produced rotating per-test timeouts that looked like app bugs. Healthy ≈ <10.
- Serial mode + retries re-runs whole describe groups (~8–12 min/pass); keep tests self-contained; 120s budgets in beforeEach.
- `gh pr create` breaks on heredoc bodies → `--body-file`. Repeat write-backs need `board-sync.mjs --no-cache` (stale `.board-cache.json`).
- Don't debug UI login in the preview browser (dead end — see phase-1/2 challenges); auth.setup-provisioned storageState is the way.
- Mantine gotchas: options detach mid-click (3× retry pattern in `pickSuggestion`); async-selects have no `input[role=combobox]` (use `async-select-<field>` testid).

### 5.1 Common issues & how to resolve — **check this table before debugging any red run**

Most failures in this repo are environmental, not app defects. Symptom → cause → fix. Canon: [challenges_blockers_resolutions/INDEX.md](challenges_blockers_resolutions/INDEX.md) (C1–C13); AIOS-side copy: `~/.config`-independent playbook at `AIOS/core/skills/qa/playwright/SKILL.md` (also embedded in the `ehealthwares/qa` + `ehealthwares/rxsoft/qa` agent definitions).

| # | Symptom | Cause | Resolution |
|---|---|---|---|
| 1 | Rotating per-test timeouts that look like app bugs | **Load trap**: load-avg > ~10 freezes Chromium + Node together (incident: 216) | `uptime` before every run (healthy <10); wait or recycle services, then re-run. Never diagnose app behaviour under load. |
| 2 | `node: command not found`, all daemons dead, `/tmp/*.log` wiped | Freebuff/host restart drops the nvm PATH and kills watch processes | Re-export nvm PATH, then use the quick-start block in [server_restart_command.md](server_restart_command.md); output it and **wait for the user** (rule 4). |
| 3 | Provisioning 500, or seed health/provision 404 | Seed is on **:8094** (EMR owns :8093); provision requires `x-api-key` | `export SEED_PROVISION_API_KEY=$(grep '^SEED_API_KEY=' ../seed/.env \| cut -d= -f2)`; confirm `SEED_BASE_URL=http://localhost:8094`. |
| 4 | Stuck on `/sign-in`, 401→403 loop, whole app remounts, every control "element was detached from the DOM" | Hollow org: identity `roles`/`user_roles` empty → user gets `roles: []`, authenticated router 403-loops (remounts the app) | Verify role rows for the org, reprovision a fresh org (or DEFAULT `admin`/`password`), file the defect against seed/identity — **never patch the spec to pass**. |
| 5 | Route subtree remounts; Mantine ids change mid-interaction | `AppBootstrap` declared inline in `ModuleProvider` (**ui#84**, fixed in master) | Pull master; regression test `src/context/module-provider.test.tsx` (hoist + memoize `AppBootstrap`, dedupe `bootstrap()`). |
| 6 | Mantine option detaches mid-click; async-select has no `input[role=combobox]` | Mantine portal re-render | 3x retry in `pickSuggestion`; use the `async-select-<field>` testid (testid-first rule). |
| 7 | `page.goto: Cannot navigate to invalid URL` for every test | Playwright ran **without** `--config e2e/playwright.config.ts` → no baseURL | Always pass `--config e2e/playwright.config.ts --project=setup --project=admin`. |
| 8 | Run never finishes after green tests (4c11: killed after 28 min) | seed#12: `DELETE /api/provision/:code` hangs | **Fixed** — `deprovisionOrganization` aborts after 30s (`SEED_DEPROVISION_TIMEOUT_MS`), throws, and teardown logs `deprovision NOT confirmed` then exits (regression test: `e2e/utils/provision.test.ts`). Results are already in the reporter — never wait on teardown. |
| 9 | Fresh org list endpoints return `[]` while DEFAULT org has rows | Seed on the wrong port / FK-CASCADE deletes removed the run's rows (**#775**) | Check seed :8094 + probe the org's rows in Postgres before filing a UI/backend defect. |
| 10 | `auth.setup` fails after an env change | `.env.local` flipped to production/stale → provisioned storageState no longer matches | Force `.env.local` back to localhost and **restart Vite**. |
| 11 | A pass takes 8–12 min; failures migrate between tests | Serial mode + `--retries=1` re-runs whole describe groups | Self-contained tests, 120s beforeEach budgets, no shared mutable state. |
| 12 | File tools report `[BLOCKED]` / "file does not exist" on a real file | Local-change snapshots write mode **600** | `chmod 644 <file>`; if `read_files` blocks everything, work through bash with exact-match asserts. |
| 13 | `gh pr create` fails; board write-back silently no-ops | Heredoc bodies break `gh`; stale `.board-cache.json` | `gh ... --body-file <file>`; `board-sync.mjs --no-cache`. |
| 14 | A test passes but the box stays unticked | Honesty rule **C12** + Alpha QA workflow rules 1–4 | Never tick an unverified TC; board mutations go through [board_updates.md](board_updates.md); testid-first; visible errors **and** zero POSTs. |

## 6. Reference map

| Doc | What it holds |
|---|---|
| [PLAYWRIGHT_PLAN.md](PLAYWRIGHT_PLAN.md) | infra detail: projects, provisioning, session priming, skip-gating |
| [TRACKER_STATUS.md](TRACKER_STATUS.md) | generated coverage matrix (per-phase, per-entity) |
| [challenges_blockers_resolutions/INDEX.md](challenges_blockers_resolutions/INDEX.md) | the failure-source canon (C1–C13, C1–C6 → 6 themes) |
| [tasks/data_test_id_task.md](tasks/data_test_id_task.md) | testid convention + audit + enforcement plan |
| [tasks/schema_validation_task.md](tasks/schema_validation_task.md) | validation gate design + landed state (§8) + VAL TC defs |
| [tasks/item_creation_view.md](tasks/item_creation_view.md) | recency-sort ticket + REC-01 e2e spec |
| [board_updates.md](board_updates.md) | pending board queue for the scrum-master agent |
| [server_restart_command.md](server_restart_command.md) | restart commands + troubleshooting |
