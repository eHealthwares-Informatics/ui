# Challenge Index

> Read this file **before every run**. One line per entry. Details in the
> linked file. Grep for keywords before debugging anything familiar.

| Title | File | Status | Tags |
|---|---|---|---|
| Background dev servers die with the shell (no `setsid` on macOS) | phase-0.md | resolved | services, orchestration |
| NestJS services bind port 0 when `.env` PORT isn't loaded | phase-0.md | resolved | services, ports |
| Seed provisioning requires `x-api-key`; e2e global-setup reads it from process env | phase-0.md | resolved | seed, provisioning, auth |
| Provisioning 500s on second org: demo MRNs/visit numbers globally unique | phase-0.md | resolved | seed, provisioning, emr, db-constraints |
| global-setup artifact check: stale endpoints + bare-array responses misread | phase-0.md | resolved | e2e-harness, global-setup, api-shapes |
| Fresh orgs had zero GL accounts (org-scoped, nothing seeds them) | phase-0.md | resolved | seed, provisioning, accounting |
| Docker Desktop down kills identity/rxsoft (ECONNREFUSED ::1:5432) | phase-0.md | resolved | services, docker, db |
| APP BUG: auth guard crashed on unauthenticated deep links (TC-ROOT-02) | phase-0.md | resolved | app-bug, router, guard |
| Stacked @Put/@Patch silently drops PATCH route (Price Lists edit 404) | phase-1.md | resolved | app-bug, nestjs, routing |
| Spec cleanup deleted org system roles via search-ignoring proxy → /403 cascade | phase-1.md | resolved | e2e-harness, cleanup, roles, data-loss |
| Confirm-delete: disabled-while-loading + overlay breaks click stability | phase-1.md | resolved | e2e-harness, mantine, flake |
| Dual page-title/search shells (settings, website-orders) → strict mode | phase-1.md | resolved | e2e-harness, selectors |
| uoms DELETE and roles PATCH endpoints don't exist → capability gating | phase-1.md | resolved | fixtures, api-gaps |
| Playwright webServer died mid-run → decouple Vite via daemon | phase-1.md | resolved | e2e-harness, services, vite |
| Tracker semantics: gated ≠ missing (bulk-gate made epics falsely Done) | phase-1.md | resolved | tracker, methodology |
| Ambiguous `admin` login across orgs in probe scripts | phase-1.md | resolved | seed, auth, probes |
| Legacy-spec drift surfaced by fresh backend (dashboard, sign-in-2, shop; sign-in-2's second Password field is the phone sign-in — intentional, spec-side collision only) | phase-1.md | resolved | app-drift, follow-ups |
