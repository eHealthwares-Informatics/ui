# Phase 3 — EMR Real-Backend Suite (emr-real)

> Session 2026-10-14/15: standing up the non-mocked EMR Playwright suite
> (`e2e/emr-real.spec.ts`, project `emr-real`, dedicated config
> `e2e/playwright.emr-real.config.ts`) against live Identity :8092, EMR :8093,
> seed :8094, Vite :5173.

## C14 — Provisioned org users get `modules: []` (wildcard permissions not expanded)

**Symptom.** emr-real sign-in hangs at `toHaveURL(/\/emr/)` — the app grants
modules from identity `GET /auth/me`, which returned
`{"roles":["admin"],"permissions":[],"modules":[]}` for every seed-provisioned
org user. The mocked EMR suite never hit this (it fakes `/auth/me` with a
hardcoded EMR module).

**Cause.** Seed's org template granted wildcard permissions (`emr.*`, `lis.*`,
`rxsoft.*`, …). Identity's `getUserModules()` maps stored permission codes to
modules; wildcards were stored literally and matched nothing → no modules.

**Resolution.** Upstream (2026-10-15): seed PR #20 + identity PR #14
"provisioner parity" — grant **parent permissions** instead of `.*` wildcards
(identity's own template grants parents). Verified live: provisioned owner now
returns `permissions:["rxsoft","lis","emr",…]` and a populated `modules` array.
Tags: seed, identity, provisioning, permissions, emr.

## C15 — Seed provisioner OOM: whitelists ~40k items per org, 4GB heap exceeded

**Symptom.** Seed died mid-run. Log:
`Provisioned EMR-…: 39623 items, 9 roles, 4 parties` →
`FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of
memory` in `Buffer::StringSlice` (serialising the HTTP response containing
~40k `whitelistedItemCodes`). Also made provisioning take minutes → beforeAll
hook timeouts → whole suites skip.

**Cause.** `POST /api/provision` defaults `whitelistItems: 'all'`; the
playwright template whitelists every active global item per org and returns the
full code list in the response JSON.

**Workaround (QA, landed).** Pass a restricted `items` list in provisioning —
unknown codes are skipped-with-warning, so
`items: ['EMR-E2E-NO-ITEMS']` ⇒ zero items whitelisted, provision drops to
~55s, response is tiny. EMR flows don't touch the rxsoft pharmacy catalogue.
**Upstream fix needed (seed#17-class):** cap the playwright-template item
whitelist or paginate/stream the response payload.

Tags: seed, provisioning, oom, performance, emr-real.

## C16 — emr-real identity probe requires a `/health` route identity doesn't have

**Symptom.** Whole emr-real suite self-skips: `identity=false` in the beforeAll
health report even with identity up.

**Cause.** Upstream `probeIdentity` fetched `${IDENTITY_BASE_URL}/health` and
required `res.ok`; identity has no health controller (404). (The main
`global-setup.ts` never had this problem — it probes identity by logging in.)

**Resolution (QA, landed).** `probeIdentity()` treats ANY HTTP response
(incl. 404/405) as up; only connection-level failure means down. Optional
upstream nicety: add a `/health` controller to identity.
Tags: e2e-harness, emr-real, health-check, identity.

## C17 — Dev `VITE_EMR_API_URL` unset → SPA fallback returned HTML for EMR API calls (500 error boundary)

**Symptom.** emr-real UC-EMR-01 hit the app 500 error boundary on `/emr`:
`TypeError: Cannot read properties of undefined (reading 'totalAppointments') at
EmrDashboardPage (dashboard-page.tsx:126)`. Direct API check showed the EMR
backend returns the correct shape (`metrics.totalAppointments`, `appointments`,
`providerLoad`, `upcoming`).

**Cause.** In dev, `VITE_EMR_API_URL` was missing from `.env.local`, so
`emr-api.ts` fell back to relative `/api/emr` — and `vite.config.mjs` has **no
`server.proxy` at all** (only `allowedHosts` + `watch.ignored`). Vite's SPA
history fallback served index.html for `GET /api/emr/dashboard`; axios left it
as a string; `data.metrics` undefined → crash. Every other module works because
`.env.local` gives them absolute localhost URLs (identity :8092, rxsoft :8080,
lis :8002…). The mocked EMR suite could never catch this:
`installEmrMocks` intercepts `localhost:5173/api/emr/*` at the network layer
and never exercises the proxy path. **This is exactly what the real-backend
suite exists to catch.**

**Resolution (QA, landed).** Added `VITE_EMR_API_URL=http://localhost:8093/api`
to `.env.local` (fleet pattern: browser→backend direct, `app.enableCors()` in
emr main.ts), restarted Vite (canon row 10: env change ⇒ Vite restart).
**Upstream options:** add `server.proxy` entries for the relative fallbacks
(nginx parity in dev), or ship a dev default env. Tags: e2e-harness, emr-real,
vite, proxy, app-bug (dev-env), error-boundary.

## C18 — Redesigned sign-in screen broke emr-real `signInAsAdmin`

**Symptom.** All emr-real tests timed out at `getByLabel('Username')` /
`getByLabel('Email or username')` on `/sign-in` — 60s each, every test.

**Cause.** Master's new auth screen
(`src/features/rxsoft/pages/sign-in/index.tsx`, "Welcome back" card) renders
labels as plain `<Text>` — **not real `<label>` elements**, so `getByLabel`
can never match. The old `label="Username"` grep hit lives in the
sign-in-2 variant component, not the active route. Submit button is
`data-testid="sign-in-submit"` ("Sign In", capital I — old "Sign in" is gone).

**Resolution (QA, landed).** Testid-first (canon rule):
`getByTestId('sign-in-username' | 'sign-in-password' | 'sign-in-submit')`.
Testids exist on the custom form (`sign-in-form` wrapper). Lesson: when a page
renders labels as text, grep for `data-testid` in the ACTIVE route component,
not any component matching the route name. Tags: e2e-harness, emr-real,
selectors, testid-first, auth.

## C19 — emr-real dashboard assertion asserted a nonexistent heading

**Symptom.** After sign-in worked, UC-EMR-01 failed: heading
`/EMR Dashboard|EMR/` never visible — yet the screenshot showed a perfect
dashboard (greeting "Good afternoon", 4 metric cards, live org data).

**Cause.** `EmrDashboardPage` renders `RxPage title=""` — there is no
"EMR" heading anywhere (only breadcrumb + sidebar text). The upstream
assertion was written from the mocked suite's imagination, never validated
against the real render (the suite had never gotten this far green).

**Resolution (QA, landed).** Assert what actually renders: greeting heading
`/Good (morning|afternoon|evening)/i` + unique metric subtitles
(`/still scheduled/`, `/visits in progress/`, `Provider Workload`,
`/No check-ins yet/i`) — subtitles avoid strict-mode dupes with the workspace
section title. Tags: e2e-harness, emr-real, assertions, screenshot-triage.

- **Dedicated config**: `e2e/playwright.emr-real.config.ts` — no globalSetup
  (the rxsoft global setup provisions a full-catalogue org every run: slow +
  OOM-prone per C15), `reports/emr-real/` output, workers=1 (single file,
  cross-test UC chain: appointment → visit → encounter → documentation).
- **Lean provisioning is mandatory** for any seed-provisioned e2e org that
  doesn't need pharmacy items; global-setup (rxsoft suites) still whitelists
  all and remains exposed to C15.
- Identity exposes no `/health`; seed probes use `/api/imports/health`; EMR
  uses `/api/health`.
- Host restarts wipe `/tmp` logs and kill daemons; re-check all four services
  (seed 200, emr 200, identity any-HTTP, Vite 200) before blaming specs.
- `| tail` piping hides Playwright output when a run never exits — background
  the run to a log file and poll that instead.
- **Run-1 evidence (2026-10-15, 26.6m)**: 2 passed / 4 flaky / 21 skipped.
  Flaky = each NEW `/emr/*` route's first browser hit took 5–7 min, retry
  ~20s (Vite on-demand compile of that route's graph under memory pressure;
  UC-EMR-02 5.7m→19s, 04 5.2m→22s, 05 6.7m→24s). retries=1 absorbed it.
  Skips started when seed died mid-run again (`fetch failed` on provision;
  stale log showed EADDRINUSE from a twin instance — never start a second
  seed while one holds :8094). Seed mortality under repeated
  provision/deprovision cycling remains an open seed-side concern (C15
  family): monitor `node --max-old-space-size` headroom or restart seed
  between long suites.
- Warm the four services before every emr-real run:
  seed `/api/imports/health` 200, EMR `/api/health` 200, identity any-HTTP,
  Vite `/sign-in` 200 — and check exactly ONE process holds :8094.

## C20 — Appointments API: `patient_name` NOT NULL but not DTO-validated (raw SQL 400)

**Symptom.** `POST /api/appointments` without `patientName` returns
`400 {"error":{"code":"23502", … "null value in column \"patient_name\" of
relation \"appointments\" violates not-null constraint"}}` — a raw Postgres
constraint error surfaced instead of a class-validator field error.

**Cause.** `appointments.patient_name` is NOT NULL in the DB, but the create
DTO doesn't mark `patientName` required. The UI's PatientPicker always composes
the name, so browser flows never hit the gap; the emr-real suite's API fixtures
did.

**Resolution.** Backend (Developer): `@IsString() @IsNotEmpty() patientName` on
the create-appointment DTO (or drop the denormalised column and compose
server-side from the patient record). QA-side, the fixture now composes
`patientName` from the created patient's `firstName/lastName` exactly as the
UI does. Tags: emr, validation, dto, db-constraints.

## C15 escalation — playwright-template provisioning degrades run over run

Measured wall-clock for the demo-data block (same lean input,
`items: [unknown-code]`):

| Context | Provision time |
|---|---|
| manual curl, idle box | ~55s |
| emr-real run, suite load | 3m10s |
| emr-real run, later suite load | **7m53s** |

Consequences: Node/undici's **default 300s `headersTimeout`** kills client
fetches mid-provision — seed completes fine server-side, so CHECK THE SEED LOG
before treating "Provisioning failed: fetch failed" as a seed outage — and
beforeAll hook budgets blow. QA-side mitigations landed:
`testInfo.setTimeout(600_000)` on beforeAll + 3-attempt provisioning retry
with 30s gaps. **Upstream needed:** profile the demo-data insert path
(identity round-trip per row?), chunk inserts, and/or document expected
provisioning latency. Tags: seed, provisioning, performance, undici, timeout.

## C21 — APP DEFECT: visit-detail renders two "Record Encounter" dialogs

**Symptom.** emr-real UC-30 failed on strict-mode violation:
`getByRole('dialog', { name: 'Record Encounter' })` resolved to **2 elements**
after a single "Add encounter" click.

**Cause.** `visit-detail-page.tsx` wraps `<EncounterForm>` in its own
`<Modal title="Record Encounter">`, while `EncounterForm` **also renders its
own** `<Modal opened={opened} title="Record Encounter">` — when the page opens
the wrapper, both mount. Nested duplicate modal semantics (a11y + Escape/
backdrop behaviour) for real users too, not just tests. The mocked EMR suite
never hit it — its UC-30 goes through the encounter-detail page, which doesn't
nest.

**Status.** Filed to Developer (app defect, low severity — verify visual
behaviour; the fix is to drop one of the two Modals). QA-side, the spec scopes
interactions to the inner/last dialog. Tags: emr, app-bug, modal, a11y.
