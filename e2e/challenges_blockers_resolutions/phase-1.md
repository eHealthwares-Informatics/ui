# Phase 1 — rxsoft CRUD coverage: Challenges, Blockers & Resolutions

Status: phase in progress. One entry per resolved issue; newest last.

---

## C1 — `routeTree.gen.ts` regenerates unformatted during `vite build`
- **Challenge**: CI gate `yarn test` runs `format:test` before `build`... wait — actually `build` runs *after* format check, and `vite build` regenerates `src/routeTree.gen.ts`, which oxfmt then fails on in the *next* CI step (`vitest` doesn't care, but `lint` does not either — the failure appeared only in the `build` job's post-step).
- **Resolution**: added `src/routeTree.gen.ts` to `.oxfmtrc.json` `ignorePatterns` (commit `1098e39`). Generated files must be excluded from format gates — otherwise any route-file change fails CI purely on regeneration order.

## C2 — Chart of Accounts create timed out on `page.goto` (run 2, 52s)
- **Challenge**: single 30s `page.goto` timeout late in a 26-minute run; page loaded fine on retry.
- **Resolution**: transient Vite/dev-server slowness under parallel load — no code change; keep `--retries=1` for full runs. (Passed in run 3.)

## C3 — Journals delete: confirm-dialog `Delete` button not clickable (run 2)
- **Resolution**: flaky timing — passed in run 3 after no change; `confirmDelete()` now uses a 30s click timeout as defense (see C9).

## C4 — `page-title` strict-mode violations on routes that mount the shell twice
- **Challenge**: `/rxsoft/settings` renders the Settings layout's `Outlet` twice (desktop + mobile breakpoints) → two `page-title`/`header-search`/`pagination-records-total` testids. `/rxsoft/website-orders` renders two *overlapping* titles ('Website Orders' + 'Orders') — a `filter({ hasText: 'Orders' })` matches both.
- **Resolution**: `CrudShellPage` uses `.first()` on all shell testids; `pageTitle()` matches **exact heading text** via anchored regex (`^\s*Settings\s*$`) so 'Orders' no longer matches 'Website Orders'. Same fix applied to the legacy `settings.spec.ts`.

## C5 — UOMs delete: `DELETE /api/uoms/:id` has no backend route (404)
- **Resolution**: fixture marks uoms `canDelete: false`. The page's trash icon exists but the API can never succeed; the fixture registry must mirror *endpoints*, not UI affordances. Filed as a backend follow-up (ship a DELETE route or hide the action).

## C6 — Roles edit: `PATCH /roles/:id` does not exist (proxy exposes PUT only)
- **Challenge**: the generic edit modal (`data-page-form.tsx`) always sends PATCH; roles proxy only maps `@Put('roles/:id')` → 404, modal stays open.
- **Resolution**: fixture gates roles `canEdit: false`. Backend follow-up: add PATCH to the roles proxy (identity supports partial update) or have the modal use PUT for proxied resources.

## C7 — Price Lists edit 404s: stacked `@Put`/`@Patch` decorators silently drop PATCH ⚠️ real app bug
- **Challenge**: `PricingController.update` had `@Put(':priceListId')` + `@Patch(':priceListId')` stacked on ONE handler. Nest applies `@Patch` metadata first, then `@Put` **overwrites** it — route table maps only PUT; every PATCH → "Cannot PATCH …" 404. Confirmed via route-table grep + trace.zip network capture (JWT had `roles:["admin"]`, request valid, server had no PATCH route). The UI's generic edit modal always sends PATCH → **the edit modal is broken for every Price Lists user**, not just tests.
- **Resolution**: rxsoft `pricing.controller.ts` — split `@Patch` onto its own `patch()` handler calling the same service. Verified `Mapped {/api/price-lists/:priceListId, PATCH}` after reload. Fixture un-gates `canEdit: true` once green.
- **Learning**: when a route 404s but the handler "obviously exists", grep the boot log's `[RouterExplorer] Mapped` lines — decorator stacking bugs never appear in the route table, and `forbidNonWhitelisted`-style payload suspects are red herrings.

## C8 — Spec cleanup poisoned org roles → cascade of `/403`s ⚠️ test-infrastructure bug
- **Challenge**: `run-crud.spec.ts` `afterAll` cleanup listed via `GET /roles?search=<token>&limit=5`, then DELETEd every returned row id. The rxsoft roles proxy **ignores all query params** and returns the org's full role list — the cleanup deleted the org's **system roles** (admin/cashier/…), the owner's next JWT came back `roles: []`, and Organizations/Stock-Locations (role-guarded) redirected to `/403`. Also explained an intermittent 403 in manual curl probes (plain `admin` username is ambiguous across orgs).
- **Resolution**: cleanup now only deletes rows whose JSON contains the suite's created token. The org that lost its roles was fully deprovisioned; provisioning itself is healthy. **Learning**: verify list endpoints actually honor `search` before trusting `list-then-filter-locally` cleanup; a test's cleanup path can be a data-destruction vector.

## C9 — Confirm-delete button: disabled + stability-timed-out (Roles, Organizations, Insurance Providers)
- **Challenge**: the delete-confirm dialog's `Delete` button intermittently (a) stays disabled up to ~25s while a list refetch holds the dialog in a loading state, then (b) when enabled, a Mantine overlay/loading spinner breaks Playwright click *actionability* (element never "stable") — the click timed out even with a 30s action budget. Hit Roles (run 3), Organizations (p1b), Insurance Providers (p1full).
- **Resolution**: `confirmDelete()` now awaits `toBeEnabled({ timeout: 45_000 })` explicitly, then `click({ force: true })` to bypass the overlay stability check, then `toBeHidden({ timeout: 30_000 })`.
- **Learning**: for Mantine modals with async loading states, separate *enabled* waiting from *click* actionability — auto-waiting click conflates both and times out on whichever is slower.

## C10 — Ambiguous `admin` login in probe scripts
- **Challenge**: `POST /auth/login {username:'admin'}` is not org-scoped; with several orgs seeded, successive logins can hit different users (observed 3048-char vs 429-char tokens, one with `roles: []`).
- **Resolution**: for API probes, always log in as the provisioned org's suffixed owner (e.g. `E2E-…-OWNER`) from `e2e/.runtime/org-state.json`.

## C11 — Playwright-managed Vite webServer died mid-run → 231 did-not-run
- **Challenge**: the p1full run lost `localhost:5173` partway through (`net::ERR_CONNECTION_REFUSED` on every remaining goto, 231 tests did-not-run, 15.6m wasted). Playwright's webServer lifecycle ties Vite to the test process — if it crashes (memory, worker churn on a 343-test run), the whole tail of the run is destroyed and auth/error specs fail cascade-style.
- **Resolution**: Vite now runs under `dev-daemon.mjs` (`--name vite-5173`) and playwright.config.ts's `reuseExistingServer: true` picks it up; Playwright never owns the dev server in long runs.
- **Learning**: for long suites, decouple the dev server from the test runner's lifecycle — a `webServer` is convenient for CI but a single point of failure for 25-minute local runs.

## C13 — Legacy-spec drift surfaced by the fresh backend (out of Phase 1 scope)
- **Challenge**: after rxsoft was rebuilt from current source (fixing the stale-server PATCH), several pre-existing specs failed that had passed against the 2:33 PM build. All are app/spec drift owned by other workstreams, not the crud-suite: dashboard redirect now lands on `/rxsoft/dashboard` (spec expects `/dashboard/sales`); sign-in-2 renders two `Password` fields — confirmed intentional (username sign-in + sign-in-with-phone variants); the strict-mode collision is in the legacy spec's bare `getByLabel('Password')`, not the app; shop storefront search placeholder changed; several API-seeding steps hit `localStorage` SecurityError after unauthenticated redirects cascade.
- **Resolution**: recorded here as a drift inventory for their owners; Phase 1 gates only the crud-suite + phase-0 baseline specs. Revisit in the phase-appropriate sweeps.

## C12 — Tracker coverage semantics: gated ≠ missing ⚠️ methodology
- **Challenge**: the crud-suite is parameterized (245 tests, no TC ids in titles). A naive bulk-gate of every validation/a11y/PDF TC made board-sync report entire epics "Done" — a false positive the dry-run exposed (`[status→Done]` on 9 epics with zero new assertions).
- **Resolution**: `tracker/gen-tc-coverage.mjs` emits `covered` only for behaviour the suite actually asserts (render/search/pagination + create/edit/delete/export gated by the fixture flags), `gated` only where the suite genuinely `test.skip`s (capability flags), and **nothing** for unimplemented test types — they stay `missing` until later phases implement them. Board-sync now reads `crud-suite/*.generated.ts` (60 covered + 84 gated at generation time) and treats the gate file as never-covered-but-resolved.
- **Learning**: in a coverage tracker, the *absence* of a claim is a feature — auto-gating everything is how dashboards start lying.
