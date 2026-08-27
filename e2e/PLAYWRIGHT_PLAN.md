# Playwright E2E Test Plan — RxSoft Frontend (current)

## 1. Goal & Scope

Comprehensive browser E2E suite for the `frontend/` app (Vite dev server, port 5173).

- **APM is OUT of scope** (user-confirmed). Existing APM docs/specs were removed from the suite.
- Priority: **RxSoft core → Damorex POS + purchases → remaining modules** (LIS, Conversation,
  Communication, Coding-Concept — write suites + start their backends).
- **Data strategy (user-confirmed):** live dev DB, but isolated per run — `global-setup.ts` provisions a **fresh organisation** via the seed service (`POST /api/provision`, code `E2E-<date>-<run>`); every suite signs in as that org's owner and `global-teardown.ts` deprovisions it. Mutating suites use unique tokens and run serially within a resource. When the seed service is down (local dev, mocked-only projects), the suite falls back to the DEFAULT org `admin`/`password`. Unavailable backends/modules are `skip`-gated, never hard-failed.

## 2. Environment

| Service | Port | Running? | Used by |
|---|---|---|---|
| Frontend (Vite) | 5173 | yes | webServer (reused) |
| rxsoft + APM backend | 8080/api | yes | RxSoft, Damorex, website |
| identity | 8092 | yes | login/auth |
| conversation | 8090 | no | module suite (skips until started) |
| LIS | 8091 | no | module suite (skips until started) |
| EMR | 8093 | no (EMR suite is fully mocked) | emr project |
| coding-concept (concepts) | 3011 | no | module suite |
| communication | 8003 | no | module suite |

## 3. Infra (in place)

- `e2e/playwright.config.ts`: projects `setup` (auth), `public`, `admin` (storageState), `emr-setup`+`emr` (mocked). `globalSetup` provisions a fresh org; `globalTeardown` deprovisions it. `webServer` reuses Vite. `workers: 4` (a single-file suite is capped at 1 worker by Playwright). `timeout: 60s` (live identity login is slow).
- `global-setup.ts`: probes `:8080/api/health` + seed health, provisions `E2E-<…>` org (seed `POST /api/provision`) when both are up, writes `e2e/.runtime/backend-health.json`; the fresh-org result lives in `e2e/.runtime/org-state.json` (gitignored).
- `global-teardown.ts`: `DELETE /api/provision/<code>` for the provisioned org (idempotent).
- `auth.setup.ts`: UI login as the fresh org owner (`utils/provision.ts::activeAdminCredentials`), writes `.auth/admin.json`.
- Provisioning fixture/template: `e2e/fixtures/org-template.json`; client: `e2e/utils/provision.ts`.
- **Session priming** (`e2e/utils/session-refresh.ts`): the identity access token expires in ~8–15 min.
  A worker-level fixture logs in once and injects the session via `addInitScript` into every test's
  page before the app boots, so suites never expire mid-run.
- Page-objects: `sign-in`, `app-layout` (NavUser sign-out), `crud-shell` (text/select fields).
- Generic CRUD runner: `crud-suite/run-crud.spec.ts` over `fixtures/rxsoft-resources.ts`
  (list, pagination, create, search-created, edit, delete, CSV export, API cleanup).
- Skipping: `utils/skip-if.ts` (`skipIfBackendDown`, `skipIfModuleMissing`, `readBackendHealth`).

## 4. Current coverage matrix (verified green)

| Area | Specs | Status |
|---|---|---|
| Auth/errors/root (public) | sign-in, sign-out, 404, 500, root redirect | ✅ 10 passing |
| RxSoft bespoke | dashboard, sales, reports, inventory, settings | ✅ 8 passing |
| Damorex POS | product→saleUOM-preselect→cart→pay→complete; hold | ✅ 2 passing |
| Damorex purchases | PO builder render + supplier validation | ✅ 2 passing |
| RxSoft CRUD generic | list + pagination per resource; create/edit/delete/export with skip guards | ✅ runner validated (full sweep pending) |
| EMR (mocked) | patients, appointments, encounters, forms, requests, staff | suite exists (mocked) |
| APM | removed per scope | — |

## 5. Phases

1. **Phase 0 — baseline/done:** auth + session fix, APM removed, public & admin shell specs green.
2. **Phase 1 — RxSoft CRUD registry:** expand `rxsoft-resources.ts` to remaining simple resources
   (uom-category, price-list-items, stock-locations, journal-entries, audit-logs, users read paths);
   extend `crud-shell` for number/switch/async fields; sweep the runner.
3. **Phase 2 — catalog:** items wizard (price/stock tabs, saleUom), categories (async parent),
   price-lists/items, uoms/uom-category, settings.
4. **Phase 3 — operations:** roles permissions, purchases→receiving→unpost, inventory
   adjust/transfer.
5. **Phase 4 — commerce:** sales complete-sale, website-orders, receivables, reports+CSV, dashboard;
   Damorex storefront + purchases line flows.
6. **Phase 5 — modules:** start backends (8090/8091/8003/3011), grant `admin` modules in identity,
   write/run LIS order workflow, Conversation chats, Communication tools, Coding-Concept search.
7. **Phase 6 — hardening:** full matrix, retries, trace review, flake log in `progress.md`.

## 6. Running

```bash
cd frontend
yarn test:e2e --project=public          # auth/errors/root (no auth needed)
yarn test:e2e --project=admin tests/damorex
yarn test:e2e --project=admin crud-suite
yarn test:e2e --project=emr             # mocked EMR
```
Requires: Vite (auto-started), rxsoft `:8080`, identity `:8092`, Postgres seeded, Mongo seeded (POS items, payment methods).

## 7. Risks

- R1 short-lived access tokens → mitigated by worker session priming.
- R2 single-file CRUD runner → 1 worker; split per-resource files to parallelize if it matters.
- R3 unprovisioned module backends → skip-gated.
- R4 live-DB mutations → unique tokens + API cleanup + serial.
- R5 Vite cold-compile per fresh context → ~20s/test floor; avoid per-test asserts that wait on stale skeletons (wait on real API rows).