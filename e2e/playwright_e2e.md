# Playwright E2E — handover & status (read this first in a fresh session)

**Purpose**: Canonical onboarding for a fresh Freebuff session continuing the RxSoft alpha-test-coverage effort. Read top-to-bottom; everything linked is in-repo.
**Board**: ehealthwares/rxsoft → "RxSoft Alpha Test Plan" (22 epics / 116 entity tasks / 593 UCs / ~2,039 TCs)
**Last updated**: 2026-10-01 ~12:00 — session summary: validation-gate + VAL work MERGED via PR #12; live regression run found + fixed 3 real bugs; **current blocker: seed provisioner writes ZERO identity role rows on a fresh identity DB** (details §2.4). Overall effort ≈ **68% complete**.

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

## 2. Session state — **2026-10-01 update**

### 2.1 The §2 work below is now MERGED (PR #12, eaf6e75) — and it was verified live for the first time

Regression run against the local stack surfaced real bugs the offline gates could not see. All diagnosed:

| Symptom | Root cause | Fix |
|---|---|---|
| VAL-01/02/03 timeout waiting for `form-submit` | button only rendered on the LAST wizard step | tab-groups.tsx: outline Submit beside step-nav on EVERY step — **committed** |
| VAL-04 `required: []` | `APIResponse.json()` is a Promise (read without `await`); path is `/api/items` (global prefix); schema is a `$ref` | spec now awaits + derefs — **committed** |
| Run 1 exercised PRODUCTION | `frontend/.env.local` pointed `VITE_RXSOFT_API_URL` at prod | `.env.local` → localhost:8080/:8092 (gitignored, local-only) |
| Provisioned orgs 401/403-loop + app remounts ("element was detached") | **seed provisioner wrote 0 rows to identity `roles`/`user_roles`/`role_permissions`** → users get `roles:[] permissions:[] modules:[]` → authenticated router rejects | ⛔ OPEN — fix provisioning (§3), then re-provision |
| DEFAULT org `admin/password` login 401 | fresh identity DB has no DEFAULT-org admin | bootstrap admin via SQL or `npm run seed -- --target identity` |

### 2.2 Committed this session

- frontend branch **`fix/e2e-val-submit-reachability`** (82a4a14, pushed to origin): tab-groups submit-reachability fix, VAL-04 spec fix, `e2e/scripts/preflight.mjs` (load/zombie/service gate — see §5), `e2e/scripts/e2e-recycle.sh` (one-command clean slate; self-heals node PATH after a Freebuff restart). Frontend `origin` remote switched https→ssh (https token stale; gh CLI absent).
- rxsoft `phase-1-pricing-patch`: O1 recency sort (f1add82) already on origin + TS18048 fix (`query.search?.includes`) to be committed.

### 2.4 The one open blocker — provisioning roles

`docker exec postgres_db psql -U postgres -d identity -tAc "select count(*) from roles"` → **0**. The seed provisioner (`seed/src/provision/provision.service.ts` §"org-scoped roles") builds role rows via `this.target('identity','roles',…)` and saves them without error, but nothing lands. Inspect the identity target registration (`target-registry.service.ts` `registerDataSource('identity', …)`) and the `roles` IMPORT_CONFIG entry — likely a missing/unregistered entity config for `roles`, `permissions`, `role_permissions`, `user_roles` on this seed build. Until fixed, every provisioned user is role-less and the suite cannot pass. Verify with: `POST /auth/login` as a provisioned owner → `/auth/me` must return non-empty `roles`+`modules`.

---

## 2-LEGACY. Landed via PR #12 (original session notes, kept for context)

### 2.1-LEGACY frontend (all green: typecheck ✅ / lint 0 errors ✅ / vitest 75/75 ✅)

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

## 3. Verification state & next actions (2026-10-01 update, in order)

1. ⛔ **Fix provisioning roles** (§2.4) → re-provision → `/auth/me` shows roles+modules.
2. **Bootstrap DEFAULT-org admin** so the auth fallback works: seed identity target or insert admin/`password12`+roles via x-api-key.
3. **Final regression run** (the canonical §5 invocation with `--workers=1`): items-validation + items-wizard + inventory-adjust + inventory-transfer must go green; commit any spec fallout.
4. Commit + PR the frontend branch; commit rxsoft TS fix + swagger.yml.
5. **Board**: apply pending board_updates.md rows; regenerate tracker (`--no-cache` on repeats).
6. **Phase 3a** (§4 below) — Purchases #104, Receiving #111, Inventory #86.
7. **Ops guardrails now standard**: run `node e2e/scripts/preflight.mjs` before every suite; `sh e2e/scripts/e2e-recycle.sh` when load > 12, after Freebuff restarts, and ~hourly during long sessions (the load-29.6 incident produced 6 spurious failures that vanished after recycle).

## 4. Going forward — phase plan

- **Phase 3a — operations flows (~50 TCs)**: Purchases #104 (21), Receiving #111 (13, incl. receive→unpost w/ password `password12`), Inventory #86 (16, adjust/transfer). Starter specs are substantial; upgrade to full UC coverage (list/sort/paginate, search/filter, error handling) + testid-first. PO screen is already `po-*`-rich.
- **Phase 3b — ops CRUD (~87 TCs)**: Roles #176 (24), Role Requests #184, Suppliers #116, Stock Locations #92 — proven crud-suite pattern.
- **Phase 4 — commerce (~65 UCs)**: sales complete-sale #123, website orders #168 / prescriptions #172, receivables, Full Business Flow #211. Seed HTTP scenario (`cd seed && npm run seed -- --http`) is the fixture.
- **Phase 5 — modules (~360 UCs)**: LIS :8091 (the 1,251-TC whale — crud-suite template first, then 5-step order workflow #728), conversation :8090 (Mongo replica set), communication :8003, concepts :3011.
- **Phase 6 — hardening**: full matrix, retries, trace review, testid-audit spec in CI rotation.

## 5. Environment & machine quirks (this Mac)

**Servers** (agent may start them when explicitly authorized in-thread; otherwise user runs them): quick-start + one-command recycle live in [server_restart_command.md](server_restart_command.md) and `e2e/scripts/e2e-recycle.sh`. Ports: rxsoft :8080 (`/api` prefix) · identity :8092 · seed :8093 (⚠ emr shares :8093 — only one at a time; boot emr once on a fresh DB so `synchronize:true` creates the 22 tables the seed provisioner needs) · vite :5173 (via dev-daemon). Postgres container `postgres_db` (postgres/postgres role; DBs rxsoft/identity/concepts/lis/emr). e2e provisions a fresh org per run via seed `POST /api/provision` (x-api-key from `seed/.env`; body needs `{code, name, template}`) — fallback DEFAULT org needs identity to actually HAVE an admin.

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
- **Load trap (now gated)**: load-avg > ~10 → rotating per-test timeouts that look like app bugs (incidents: load 216; 2026-10-01 load 29.6 → 6 spurious failures). `node e2e/scripts/preflight.mjs` fails fast with the fix; healthy < 10.
- **Fresh-DB bootstrap order**: postgres containers up → (first time) boot emr on :8093 once to create its schema → seed back to :8093 → `npm run seed -- --target backend` (39k items) → `npm run seed -- --target identity` once roles/permissions seeding works → provision orgs.
- Serial mode + retries re-runs whole describe groups (~8–12 min/pass); keep tests self-contained; 120s budgets in beforeEach.
- `gh pr create` breaks on heredoc bodies → `--body-file`. Repeat write-backs need `board-sync.mjs --no-cache` (stale `.board-cache.json`).
- Don't debug UI login in the preview browser (dead end — see phase-1/2 challenges); auth.setup-provisioned storageState is the way.
- Mantine gotchas: options detach mid-click (3× retry pattern in `pickSuggestion`); async-selects have no `input[role=combobox]` (use `async-select-<field>` testid).

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
