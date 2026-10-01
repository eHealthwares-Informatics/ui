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
| Items create wizard is a full page (createPathBuilder), not a modal; page-scope option added to CrudShellPage | phase-2.md | resolved | page-object, wizard |
| Create page requires more fields than schema marks; quiet validation (no DOM error, no POST) | phase-2.md | resolved | wizard, validation |
| async-selects lack role=combobox; use data-testid=async-select-<field>; options detach mid-click (retry) | phase-2.md | resolved | selectors, mantine |
| Serial+retry re-runs the whole group per pass under load; 120s budgets + self-contained tests | phase-2.md | resolved | playwright, flake |
| Created rows land beyond page 1 of a 39k-row includeAll catalog; search before asserting | phase-2.md | resolved | list, assertions |
| Board 0/N counters move only when UC sub-issues close; complete UCs, then write back | phase-2.md | resolved | tracker, methodology |
