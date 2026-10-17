# Task: QA coverage — branch ↔ stock-location link & per-branch storefront stock (rxsoft#20 slice 1)

**Status**: Spec ready for implementation
**Priority**: High — priority:high backend feature shipped (2026-10-16); the routing slice is blocked on the deferred design discussion, so coverage must lock the foundation in now
**Owner**: rxsoft backend (shipped) + e2e QA
**Requested by**: John — *"create the QA task for whats done"*
**Upstream feature**: eHealthwares-Informatics/rxsoft#20 (branch → stock location for branch inventory & order routing, SRS 7.6)

---

## 1. What shipped (2026-10-16, slice 1 of #20)

Backend-only slice. Storefront branches can now be attached to an inventory stock location, and the storefront can resolve per-branch availability.

| Surface | Detail |
|---|---|
| `BranchOrmEntity` | `stock_location_id` (uuid, nullable, indexed `ix_branches_stock_location_id`). **Loose reference** — like `website_orders.stock_location_id`, no hard FK cascade (branches are unscoped/shared, stock locations are org-scoped + soft-deleted). |
| Migration | `rxsoft/src/database/migrations/2026-10-16-add-branches-stock-location.sql` (idempotent `ADD COLUMN IF NOT EXISTS`; dev normally runs `DB_SYNCHRONIZE=true`, so the file targets non-runner environments). |
| Admin API | `POST /branches`, `PUT/PATCH /branches/:branchId` accept `stockLocationId`; explicit `null` clears it. Unknown or inactive stock location ⇒ `400` (`BadRequestException`). Existence-checked at the write boundary — **not** org-ownership-checked (documented caveat: branches are not org-scoped; enforcement would need `CurrentUser` passed into `BranchesService`). |
| Storefront API | `GET /website/branches/:id/stock?itemIds=a,b,c` → `{ branch, stockLocationId, fulfilmentReady, items[] }`; per item `quantityOnHand`/`quantityReserved`/`available` (available = `max(0, onHand − reserved)`), `SUM()`-aggregated across lots. No location ⇒ `fulfilmentReady: false`, `items: []` (not a 500). Unknown/inactive branch ⇒ `404`. |

Unit-level: 9 new jest specs green (assignment on create/update, unknown/inactive rejection, null-clear, 404, not-fulfilment-ready, clamping, itemId filter). Full `website` module suite 50/50 green.

## 2. NOT shipped yet (do not write UI e2e for these)

- **Admin Branches page**: no `stockLocationId` field in the UI form — the admin can only assign via raw API.
- **Storefront branch page**: no availability display wired to `branches/:id/stock`.
- **Order routing / fulfilment-persisted branch**: deferred, waiting on the design discussion.
- **"Branch cannot be configured for fulfilment without a stock location"** rule: no branch fulfilment flag exists yet to enforce against.

These are **documented skip gates** (C12-style), not "passing" — see §4.

## 3. Test cases

All backend cases are API-level e2e (Playwright `request` fixture against the QA box), run through the QA-org provisioning pipeline. No UI testids are involved until slice 2 ships.

| TC | Name | Steps | Assert |
|---|---|---|---|
| `TC-RX-BRANCH-SL-01` | assign on create | `POST /branches` with an existing active `stockLocationId` | `201`; response `stockLocationId` equals the sent id |
| `TC-RX-BRANCH-SL-02` | assign on update | `PATCH /branches/:id` `stockLocationId: '…'` | persisted value returned on `GET /branches/:id` (admin surface, roles-guarded) |
| `TC-RX-BRANCH-SL-03` | reject unknown | `POST /branches` with a random uuid | `400`, message names the missing stock location; branch not created |
| `TC-RX-BRANCH-SL-04` | reject inactive | point at a deactivated stock location | `400`, message says "inactive" |
| `TC-RX-BRANCH-SL-05` | clear via null | `PATCH` `stockLocationId: null` then `GET` | returns `null` |
| `TC-RX-BRANCH-SL-06` | availability aggregation | seed balances at the branch's location (2 lots on one item) | `GET /website/branches/:id/stock`: sums across lots; `available = onHand − reserved`, clamped at `0` when reserved > onHand |
| `TC-RX-BRANCH-SL-07` | itemId filter | `?itemIds=i1,i2` | only filtered items; no filter → all items at the location |
| `TC-RX-BRANCH-SL-08` | not fulfilment-ready | branch with `stockLocationId: null` | `fulfilmentReady: false`, `items: []`, HTTP 200 — and **no balance query side effects** |
| `TC-RX-BRANCH-SL-09` | unknown / inactive branch | `GET /website/branches/{unknown,softDeleted}/stock` | `404` |
| `TC-RX-BRANCH-SL-10` | inactive branch hidden | branch `isActive: false` | plain `GET /website/branches/:id` and `…/stock` both `404` (existing behavior, regression-guard for the new endpoint) |

**Cleanup hook (afterAll)**: soft-delete any `POST /branches` rows created (`DELETE /branches/:id`) so the shared branches table isn't polluted across QA runs — branches are global, not per-QA-org (per the entity's own scoping notes).

## 4. Documented skip gates (C12)

- `TEST.DEFINE.skip('admin UI: assign stock location in Branches form')` — **gate**: no admin form field exists; unskip when slice-2 wires the form (then select testid-first per `data_test_id_task.md`, never label-proximity).
- `TEST.DEFINE.skip('storefront branch page shows per-branch availability')` — **gate**: no availability display wired; unskip when the storefront consumes `branches/:id/stock`.
- Org-ownership enforcement of stock-location assignment is a known unspecified behavior (see caveat in §1); when the product decision lands, add TC-SL-11: assigning another org's stock location.

## 5. Where the specs live

`frontend/e2e/crud-suite/` (or a new `branch-stock.spec.ts` beside it) — same harness/pattern as the other rxsoft-resource API suites. Proposed UC id: **UC-RX-BRANCH-SL-01**, parented under the shop/webshop epic used by `TEST_CASES.md` for the storefront's `branches` page group.

## 6. Estimate

| Chunk | Size |
|---|---|
| API-level spec, TCs SL-01…SL-10 + cleanup hook | ~0.5 day |

---

## Board note

Tracked as **eHealthwares-Informatics/rxsoft-qa#807** — "QA UC-RX-BRANCH-SL-01 — Branch stock-location assignment + per-branch storefront stock (rxsoft#20 slice 1)". Created in-thread on explicit user request (AGENTS.md QA rule 3 exception) and added to the org board (ehealthwares/projects/1) with Status=Todo on 2026-10-16; recorded Done in [../board_updates.md](../board_updates.md). Tick only what a green QA-box run evidences (C12).
