# Phase 0 — Challenge Log

## Background dev servers die with the shell (no setsid on macOS)
- **Phase:** 0 · 2026-09-27
- **Challenge:** Start rxsoft/identity/seed in the background from a terminal tool that kills its process group when the command exits.
- **Blocker:** `nohup x &` dies with the shell; `setsid` does not exist on macOS. Services "started" then vanished within seconds; ports stayed down.
- **Resolution:** `frontend/e2e/tracker/dev-daemon.mjs` — Node spawn with `detached: true` (new process group/session), pidfile state in `/tmp/rxsoft-e2e-daemons.json`, `--stop`/`--status` subcommands.
- **Prevention:** Always launch services via `dev-daemon.mjs`, never bare `&`. Verify with `dev-daemon.mjs --status` + a port probe.

## NestJS services bind port 0 when .env PORT isn't loaded
- **Phase:** 0 · 2026-09-27
- **Challenge:** Health-check the freshly started backends on their expected ports.
- **Blocker:** identity bound `*:51468` ("running on port 0") and rxsoft bound a random high port — `ConfigService.get('PORT')` read nothing because `.env` isn't loaded before bootstrap in identity, and rxsoft's `.env` parse is unreliable for PORT. `lsof` on the expected port then reports down even though the service is "up".
- **Resolution:** Launch with explicit env: `-- env PORT=8080 yarn start:dev` (rxsoft), `-- env PORT=8092 npm run start:dev` (identity). Seed already loaded its own env correctly.
- **Prevention:** Pass PORT explicitly for rxsoft and identity when starting via the daemon; probe health endpoints (`/api/health`, `/auth/me`, `/api/imports/health`) after start, never just check process liveness.

## Seed provisioning requires x-api-key; e2e global-setup reads it from process env
- **Phase:** 0 · 2026-09-27
- **Challenge:** Let global-setup provision a fresh org (template `playwright`) instead of silently falling back to the DEFAULT org.
- **Blocker:** `seed/.env` sets `SEED_API_KEY` (len 19), and `ProvisionController.assertKey` rejects unsigned `POST /api/provision`. The e2e `utils/provision.ts` reads `process.env.SEED_PROVISION_API_KEY ?? SEED_API_KEY` — empty in a normal shell, so provisioning would fail and global-setup would log a warning and fall back to DEFAULT org.
- **Resolution:** When running Playwright, export `SEED_PROVISION_API_KEY=$(grep '^SEED_API_KEY=' ../../seed/.env | cut -d= -f2)` in the launch environment (value never echoed). Documented here so every run does it before `yarn test:e2e`.
- **Prevention:** A `global-setup` log line "provisioning … failed — using DEFAULT org admin" means the key wasn't exported; treat that as a setup bug, not a fallback success.

## Provisioning 500s on second org: demo MRNs/visit numbers are globally unique
- **Phase:** 0 · 2026-09-27
- **Challenge:** Provision a second fresh org (any run after the first) with template `playwright`.
- **Blocker:** `POST /api/provision` returned 500 — `duplicate key value violates unique constraint IDX_1dc2db3a63a0bf2388fbfee86b (patients.patient_id)=(MRN-DEMO-001)`. `patients.patient_id` and `visits.visit_number` carry **global** unique indexes (not org-scoped), but the demo template used fixed MRNs/visit numbers and the idempotency lookup (`findAll()`) is org-scoped, so it never sees other orgs' rows.
- **Resolution:** `seed/src/provision/provision.service.ts` now suffixes demo MRNs and visit numbers with the org code (`MRN-DEMO-001-<ORGCODE>`, `VIS-DEMO-001-<ORGCODE>`); admissions/wards/beds/departments have no global indexes and stay as-is.
- **Prevention:** Any new seeded demo identifier on a table with a global unique index must include the org code from day one; provisioning a second org is the standard smoke for this.

## global-setup artifact check: stale endpoints + bare-array responses misread
- **Phase:** 0 · 2026-09-27
- **Challenge:** The eager seed-artifact validation must reflect reality or it blocks every run.
- **Blocker:** Three failures: `/price-list-items` and `/branches` are 404 (no such controllers — price-list items are nested `GET /price-lists/:id/items`; "branches" live in identity locations), and `/roles` returns a **bare array** which the `{data}.length` reader counted as 0.
- **Resolution:** `global-setup.ts` now checks the nested price-list-items route (resolving the first price list id), replaces Branches with Stock Locations, and `countRows()` accepts `{data|items|results}`, bare arrays, and `{total}`.
- **Prevention:** Before adding an artifact check, curl the endpoint once and note the response shape; the backends deliberately mix envelope shapes.

## Fresh orgs had zero GL accounts (org-scoped, nothing seeds them)
- **Phase:** 0 · 2026-09-27
- **Challenge:** `gl-accounts` artifact check for a freshly provisioned org.
- **Blocker:** `gl_accounts` is strictly org-scoped (`uq_gl_accounts_org_code`) and neither global seeds nor the provision template created any — every fresh org failed the check legitimately.
- **Resolution:** The provision service now seeds a 9-account starter chart of accounts (asset/liability/equity/income/expense) for each new org, upsert by `(organization_id, account_code)` semantics via conflict on id + existing-code lookup.
- **Prevention:** Whenever a backend table is org-scoped with no global fallback data, provisioning must seed it — check `provision.service.ts` when adding artifact checks.

## Docker Desktop down kills identity/rxsoft (ECONNREFUSED ::1:5432)
- **Phase:** 0 · 2026-09-27
- **Challenge:** Services that were healthy earlier in the session started failing login/queries.
- **Blocker:** identity logged `AggregateError ECONNREFUSED ::1:5432`; Docker Desktop had exited (session restart), so the Postgres container was gone while the Nest processes stayed "up".
- **Resolution:** `open -a Docker`, wait for the daemon, containers auto-start (`docker ps` shows rxsoft-postgres/mongodb Up); logins 200 again within ~30s.
- **Prevention:** Pre-flight = Docker daemon check (`docker info`) **plus** port probes; a listening app port does not mean its DB is reachable.

## APP BUG: auth guard crashed on unauthenticated deep links (TC-ROOT-02)
- **Phase:** 0 · 2026-09-27
- **Challenge:** `TC-ROOT-02` expects `/rxsoft/items` (unauthenticated) to land on `/sign-in?redirect=…`.
- **Blocker:** The URL stayed on `/rxsoft/items`; console showed `TypeError: Cannot convert object to primitive value at beforeLoad (route.tsx:20)`. TanStack Router's `beforeLoad` location exposes `search` as a **parsed object** (null-prototype), so `location.pathname + location.search` threw and the redirect never happened — every unauthenticated deep link silently broke (the page just hung).
- **Resolution:** `frontend/src/routes/_authenticated/route.tsx` now uses `location.searchStr` (the string form, per router-core typings). Probe confirms `/sign-in?redirect=%2Frxsoft%2Fitems`.
- **Prevention:** In `beforeLoad`, never string-concat `location.search` (object) — use `searchStr`. Guard redirects are exactly the code paths with no human clicking around in dev, so they rot silently; TC-ROOT-02 is the regression test.
