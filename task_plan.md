# Task Plan: Comprehensive Playwright E2E Suite — RxSoft Frontend

## Goal
Author a refreshed, execution-ready Playwright E2E test plan for ALL frontend features (understanding the entity hierarchy & workflows first), then build out and run the suites in phases — with priority on the RxSoft core, Damorex POS + purchases, then LIS/Conversation/Communication/Coding-Concept (starting those backends). APM is explicitly OUT of scope.

## Scope decisions (user-confirmed)
- Ignore APM website/admin (existing APM specs stay but are NOT expanded).
- Keep the current live-DB approach: unique tokens, API cleanup in `afterAll`, serial mode for mutating suites, `skip-if` gating for unavailable backends/modules.
- Priority order: RxSoft core → Damorex POS + purchases → remaining modules.
- Write LIS/Conversation/Communication/Coding-Concept suites AND start those backends.
- Reuse existing infra: `playwright.config.ts`, `auth.setup.ts`, `global-setup.ts`, fixtures, page-objects, `crud-suite/run-crud.spec.ts`.

## Current Phase
Phase 3 (RxSoft operations) in progress — inventory adjustment done; Phases 0–2 mostly complete, Phase 4 Damorex done (POS+PO), commerce gaps documented.

## Phases

### Phase 0: Plan docs & baseline
- [x] Create planning files (task_plan/findings/progress) in `frontend/`
- [x] Refresh `e2e/PLAYWRIGHT_PLAN.md`, `e2e/USE_CASES.md`, `e2e/TEST_CASES.md` → current reality + coverage matrix, APM removed from suite + docs
- [x] Verify Chromium installed
- [x] Green baseline: public 10/10, admin rxsoft bespoke 8/8, sign-out 2/2 (after auth/session fixes)
- **Status:** complete

### Phase 1: RxSoft reference/master-data CRUD (runnable now)
- [ ] Expand `e2e/fixtures/rxsoft-resources.ts` registry to all simple DataPageShell resources
- [ ] Extend `crud-shell.page.ts` for select/number/switch/async-select modal fields
- [ ] Wire resources with create/edit/delete/export capabilities
- [ ] Run `--project=admin crud-suite` and fix failures
- **Status:** pending

### Phase 2: RxSoft catalog & config
- [ ] Items wizard (create incl. price/stock tabs, saleUom preselect, edit PATCH)
- [ ] Categories (async parent), price-lists + price-list-items, uoms/uom-category
- [ ] Settings, website/eHealthwares CRUD (skip drug-components/pharmaceutics when concepts backend down)
- **Status:** pending

### Phase 3: Users/permissions & operations
- [ ] Roles tri-level permissions save (bespoke spec)
- [ ] Purchases → receiving → unpost
- [ ] Inventory: balances, adjustments, transfers
- [ ] Reset-password flow
- **Status:** pending

### Phase 4: Commerce, finance & Damorex
- [x] Damorex POS (product select → saleUom preselect → add → cart → payment → complete sale) — verified 2/2
- [x] Damorex purchases (PO builder render + supplier validation) — verified 2/2
- [ ] Sales list + complete-sale (rxsoft); website-orders status; receivables
- [ ] Financial reports + CSV export; dashboard metrics (rxsoft bespoke render specs already pass)
- [ ] Damorex storefront browse/cart/checkout/orders; prescriptions/consults
- [ ] pos2
- **Status:** in_progress

### Phase 5: Module suites + backend startup
- [ ] Start backends: LIS (8091), conversation (8090), communication, coding-concept (concepts 3011)
- [ ] Grant admin the modules (identity `/auth/me`) so suites run
- [ ] LIS: reference CRUD + orders workflow stepper + report builder + QC/EQA
- [ ] Conversation: CRUD + chats + public questionnaire
- [ ] Communication: CRUD + flow tools
- [ ] Coding-Concept: search/match/upload
- **Status:** pending

### Phase 6: Hardening
- [ ] Run full matrix, trace/screenshot review, retries, data cleanup pass
- [ ] Record results + flake log in progress.md
- **Status:** pending

## Key Questions
1. Which modules does the `admin` user actually have in identity so tests can gate? (check `/auth/me`)
2. Do LIS/conversation/communication/coding-concept backends need seeding before their suites can run?
3. Are there seeded RxSoft items with org whitelist rows for POS tests? (needed for damorex POS)
4. Does `sales`/`purchases` expose API-usable unique-name fields for cleanup?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Planning files in `frontend/` not repo root | Root `task_plan.md` belongs to an unrelated seed task; frontend is this task's project |
| Reuse existing generic CRUD runner as backbone | Broad coverage cheaply; extend registry rather than hand-write per page |
| Live-DB + unique tokens + API cleanup | User-confirmed; no isolated test DB |
| skip-if gating for down backends/modules | Never hard-fail on unprovisioned services |
| APM out of scope | User-confirmed |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (filled as they happen) | 1 | |

## Notes
- Update phase status as we progress: pending → in_progress → complete
- Re-read this plan before major decisions
- Log ALL errors here and in progress.md