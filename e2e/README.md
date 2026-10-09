# Playwright E2E — RxSoft Frontend

Planning documents + test infrastructure for a comprehensive browser E2E suite covering the
RxSoft admin frontend at `http://localhost:5173`.

## Docs

- [`PLAYWRIGHT_PLAN.md`](./PLAYWRIGHT_PLAN.md) — scope, infra (config, webServer, storageState auth,
  page-objects, fixtures, CI), phased rollout, risks.
- [`USE_CASES.md`](./USE_CASES.md) — every feature page grouped by module with user-facing use cases.
- [`TEST_CASES.md`](./TEST_CASES.md) — use case → Playwright test mapping (scenario, steps, expected,
  auth, data, endpoints).
- `README.md` — this file.

## Install (execution phase)

```bash
cd frontend
yarn add -D @playwright/test
npx playwright install chromium
```

> Playwright is intentionally NOT installed yet — this repo only contains the plan.

## Run

```bash
cd frontend

# all projects (starts/reuses Vite on :5173; requires backends + seeded DB)
npx playwright test

# specific project / file / test
npx playwright test --project=admin
npx playwright test tests/apm/admin/lgas.spec.ts
npx playwright test --grep "LGA"

# headed / debug
npx playwright test --headed
npx playwright test --debug

# report (path is config-relative — not playwright's default, see below)
npx playwright show-report e2e/reports
```

## Artifacts & the Vite dev server (ui#94)

The suite runs against the Vite dev server (`webServer.command: 'yarn dev --host'`),
i.e. the same process that serves the app under test. **Any artifact Playwright
writes into a directory Vite watches fires a full HMR page reload on the page
being tested**, which kills in-flight navigations and shows up as random
`page.goto` timeouts late in a run.

| Artifact | Location | Notes |
|---|---|---|
| HTML report | `e2e/reports/` | Durable — read back by hand and by `tracker/make-phase1-report.mjs`. Excluded from Vite's watcher via `server.watch.ignored` in [../vite.config.mjs](../vite.config.mjs). |
| Traces, screenshots, `.last-run.json` | `os.tmpdir()/rxsoft-e2e-artifacts` | Ephemeral failure artifacts. Deliberately **outside** the repo root so the watcher never sees them. Override with `PLAYWRIGHT_OUTPUT_DIR`. |

Open the report with `npx playwright show-report e2e/reports` (from `frontend/`).

To confirm a path is actually excluded, write to it while the dev server is
running and grep its log for `page reload <path>` — assume nothing about the
ignore list (details: [challenges_blockers_resolutions/phase-2.md](./challenges_blockers_resolutions/phase-2.md), C7).

## Auth setup

`auth.setup.ts` (setup project) logs in as **admin / password** through the UI at `/sign-in` and
saves `e2e/.auth/admin.json` as the storageState. The `admin` and `admin-modules` projects reuse it.

- Covers `/apm/admin/*` (guard: `getAccessToken()` in localStorage) and the `_authenticated` layout
  (guard: zustand-persisted store `rxsoft-admin-auth`), since both live on the `:5173` origin.
- LIS / EMR / Conversation / Coding-Concept / Communication suites run under `admin-modules` and
  auto-`skip` when the admin user's `/auth/me` module list doesn't include that module, or when the
  backend is unreachable.

## Required running services

| Service | URL | Required |
|---|---|---|
| Frontend (Vite) | http://localhost:5173 | yes (webServer reuses) |
| Backend (rxsoft + APM) | http://192.168.1.49:8080/api | yes (admin + rxsoft + APM) |
| Identity | http://192.168.1.49:8092 | yes (login) |
| MongoDB (APM seed) | localhost:27017 | yes (APM data) |
| PostgreSQL | localhost:5432 | yes (rxsoft) |
| Conversation | :8090 | module suite only |
| EMR | :8093 | module suite only |
| seed | :8094 | provisioning (`SEED_PORT`; not :8093) |
| Communication | :8003 | module suite only |
| Coding-Concept | :8004 | module suite only |
| LIS | :8002 | module suite only |

Seeded data expected: 33 LGAs, 363 wards, 165 PUs, 30 stakeholders, 20 agents.

## Known constraints

- `.env.local` API URLs point at the LAN IP `192.168.1.49` (also reachable locally). Tests use
  `http://localhost:5173` as baseURL.
- Login: `admin` / `password`.
- CRUD tests create/delete real records against the live DB — they use unique names and clean up
  via API in `afterAll`; specs that mutate data run serially.
- Module suites skip automatically when the admin user lacks that module or the backend is down.
