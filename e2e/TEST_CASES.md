# Test Case Map (Use Case → Playwright Test)

> **Scope note (current):** APM website/admin are **out of scope** — APM specs were removed.
> Sections 2 & 3 below are historical and NOT executed.

Each test case lists: **scenario · steps · expected · auth · data · API endpoints**.

Conventions:
- **Projects:** `public` (no auth) vs `admin` / `admin-modules` (storageState `e2e/.auth/admin.json`).
- **Data:** Mongo/Postgres seeded values (33 LGAs, 363 wards, 165 PUs, 30 stakeholders, 20 agents).
- CRUD specs are generated per resource by `crud-suite/run-crud.spec.ts`; bespoke specs are handwritten.
- Any test that writes data uses unique names (e.g. `E2E-<timestamp>`) and cleans up via API in `afterAll`.

---

## 1. Auth / Errors / Root — 17 tests (project `public`)

| TC | Scenario | Steps | Expected | Endpoints |
|---|---|---|---|---|
| TC-AUTH-01 | Login success | goto `/sign-in`; fill admin/password; submit | Redirected off `/sign-in`; app shell visible | POST /auth/login, GET /auth/me |
| TC-AUTH-02 | Wrong credentials | fill admin/wrong; submit | Inline error "Invalid credentials" | POST /auth/login |
| TC-AUTH-03 | Empty validation | submit empty form | Per-field validation messages | — |
| TC-AUTH-04 | Redirect preserved | goto `/sign-in?redirect=/apm/admin/lgas`; login | URL becomes `/apm/admin/lgas` | POST /auth/login |
| TC-AUTH-05 | sign-in-2 renders | goto `/sign-in-2` | Form visible | — |
| TC-AUTH-06..08 | sign-up / forgot-password / otp | goto each; fill+submit | Each page renders + submits | POST /auth/register, /auth/forgot-password, /auth/otp (as stubbed) |
| TC-ERR-01..06 | Error pages | goto /401,/403,/404,/500,/503,/service-unavailable | Correct status heading/message | — |
| TC-ROOT-01 | Unauthenticated root | goto `/` (no storageState) | Redirected to `/sign-in` | — |
| TC-ROOT-02 | Authenticated root | goto `/` with admin state | Redirected to a module root | GET /auth/me |

---

## 2. APM Website — 15 tests (project `public`) — OUT OF SCOPE (historical)

| TC | Scenario | Steps | Expected | Endpoints |
|---|---|---|---|---|
| TC-APMW-01..12 | Page smoke tests | goto each public /apm route | Page renders its title/hero/known section; no error boundary | GET /apm/homepage, /agenda, /achievements, /news, /events |
| TC-APMW-04b | Contact form submit | fill contact form; submit | Success message; (mock or tolerate backend) | POST /apm/contact |
| TC-APMW-07b | Join form submit | fill join form; submit | Success message | POST /apm/join |
| TC-APMW-12b | Volunteer form submit | fill volunteer form; submit | Success message | POST /apm/volunteer |
| TC-APMW-11b | News article | goto `/apm/news/<known-slug>` | Article content visible | GET /apm/news/{slug} |

---

## 3. APM Admin — 24 tests (project `admin`) — OUT OF SCOPE (historical)

Auth: token required; `/apm/admin` guard redirects to `/sign-in` without it.

| TC | Scenario | Steps | Expected | Data | Endpoints |
|---|---|---|---|---|---|
| TC-APMA-01 | Guard redirect | clear storage; goto `/apm/admin/lgas` | Redirected to `/sign-in` | — | — |
| TC-APMA-02 | LGA table renders | goto `/apm/admin/lgas` | 33 rows; columns LGA/Code/Score/Status/Wards/PUs/Friendly PUs; "Afijio" present | 33 LGAs | GET /apm/conversion/lgas |
| TC-APMA-03 | Update LGA score | click Score on a row → slider/status → Save | Modal closes; row reflects new score (restore after) | LGA | PUT /apm/conversion/score/lga/{id} |
| TC-APMA-04 | Wards drill-down | click Wards on an LGA row | `/apm/admin/wards/{id}` lists wards | 363 wards | GET /apm/conversion/wards/{lgaId} |
| TC-APMA-05 | PU drill-down | from a ward, open polling units | `/apm/admin/polling-units/{wardId}` lists PUs | 165 PUs | GET /apm/conversion/polling-units/{wardId} |
| TC-APMA-06 | Conversion dashboard | goto `/apm/admin/conversion` | Stats/dashboard renders | — | GET /apm/conversion/dashboard |
| TC-APMA-07..17 | Remaining admin pages | goto each page via AdminLayout nav | Heading + table renders | seeded | GET /apm/agents, /apm/incidents, /apm/stakeholders, /apm/whatsapp/groups, /apm/tours, /apm/listening, /apm/sentiment, /apm/gotv, /apm/results, /apm/canvassing/*, /apm/content, /apm/volunteer-assignments |
| TC-APMA-06b | Create agent | AgentsPage create modal; submit | New agent row appears; cleanup via API | 20 agents | POST /apm/agents |
| TC-APMA-10b | Create incident | IncidentsPage create; submit | New incident row appears; cleanup | — | POST /apm/incidents |
| TC-APMA-17b | Add WhatsApp group | WhatsAppGroupsPage add; submit | New group appears; cleanup | — | POST /apm/whatsapp/groups |

---

## 4. RxSoft — 60 tests (project `admin`)

- **CRUD suite (~52):** generated per resource (users, roles, items, categories, suppliers,
  customers, branches, organizations, warehouses, stock-locations, uoms, uom-category,
  drug-components, pharmaceutics, manufacturers, payment-methods, price-lists, price-list-items,
  journals, journal-entries, journal-entry-lines, gl-accounts, purchases, sales, receivables,
  inventory, audit-logs) × {list renders, search, pagination, create modal, edit modal,
  delete/archive, CSV export}.
- **Bespoke (~8):**
  - TC-RX-DASH: dashboard renders 3 report widgets.
  - TC-RX-SALES: complete-sale button flow.
  - TC-RX-RECV: unpost a PO.
  - TC-RX-INV: transfer inventory via modal.
  - TC-RX-REPORTS: date-range filter + export; TC-RX-BS/IS/TB: each financial report renders + exports.
  - TC-RX-ROLES-PERM: role permissions tri-level toggles + save.
  - TC-RX-WEB-ORDERS: advance/cancel order status.
  - TC-RX-ITEMS-CREATE: create-item form validation.

Endpoints: GET/POST/PUT/DELETE `/{resource}`, GET `/{resource}/export`, GET `/{resource}/metrics`,
GET `/reports/daily-sales`, `/reports/inventory-valuation`, `/reports/top-selling-products`,
`/reports/trial-balance`, `/reports/balance-sheet`, `/reports/income-statement`,
POST `/website/admin/complete-sale/{id}`, POST `/purchases/{id}/unpost`, POST `/inventory/transfers`,
GET `/permissions/modules`, GET/PUT `/roles/{id}`.

---

## 5. EMR — 9 tests (project `admin-modules`, skip if module/backend absent)

- TC-EMR-DASH: `/emr` dashboard summary renders (GET /dashboard).
- TC-EMR-RES-01..06: each resource page (patients, appointments, visits, encounters, forms,
  requests) lists rows + search (GET `/{resource}`).
- TC-EMR-CRUD-01: create/edit/delete via the config-driven shell for patients (unique name + cleanup).

---

## 6. LIS — 52 tests (project `admin-modules`)

- **CRUD suite (~44):** per resource (test-definitions, reference-ranges, loinc, patients, samples,
  results, result-signatures, orders, panels, programs, location-types, locations,
  attribute-definitions, sample-types, priorities, test-categories, test-sections, methods, uoms,
  statuses, qa-checklist-items, qc-lots, qc-results, qc-alerts, eqa-programs, eqa-enrollments,
  eqa-results, rejection-reasons).
- **Bespoke (~8):**
  - TC-LIS-WF: full orders workflow Enter→Collect→Label→QA→Order happy path (creates order; cleanup).
  - TC-LIS-DASH: metrics dashboard renders.
  - TC-LIS-REFCOV: reference-range coverage check.
  - TC-LIS-REPORT: order report builder adds result + signature + send.
  - TC-LIS-VALID: validation dashboard renders.
  - TC-LIS-HUB: `/lis` resource grid navigation.

Endpoints: GET/POST/PATCH `/lis/orders`, GET `/lis/dashboard/metrics`,
GET `/lis/reference-ranges/coverage/{testId}`, POST `/lis/results`, POST `/lis/result-signatures`,
POST `/lis/orders/{id}/send-report`, per-resource CRUD.

---

## 7. Conversation — 26 tests (project `admin-modules`)

- **CRUD suite (~13):** channels, conversations, exchanges, option-lists, participants, projections,
  questions, questionnaires, workflows, workflow-instances, workflow-events, workflow-configuration.
- **Bespoke (~13):**
  - TC-CONV-CHAT: inbox loads, infinite scroll, send a reply.
  - TC-CONV-EXCHANGE: exchange detail thread renders.
  - TC-CONV-WFCFG: workflow configuration page renders.
  - TC-CONV-EDIT: edit an entity route loads.
  - TC-Q-01..03 (public project): questionnaire loads, creates a conversation, processes a response.

Endpoints: GET `/conversations/inbox`, GET `/exchanges`, GET `/participants`, GET/POST
`/conversations[/{id}]`, POST `/conversations/{id}/process-response`, POST `/channels/send-message`,
per-resource CRUD.

---

## 8. Coding-Concept — 19 tests (project `admin-modules`)

- TC-CC-SEARCH: search page queries + results.
- TC-CC-MATCH: match lookup renders.
- TC-CC-UPLOAD: upload page posts codes/values (mock or small fixture).
- TC-CC-CRUD-01..16: CRUD suite for drug-components, pharmaceutics, generic-drugs, facilities,
  facilities/levels, /lgas, /states, /types, /wards.

Endpoints: GET (search/match), POST `/concepts/upload/codes`, POST `/concepts/upload/values`,
per-resource CRUD.

---

## 9. Communication — 19 tests (project `admin-modules`)

- TC-COM-CRUD-01..07: messages, message-templates, notification-templates, communication-channels,
  message-logs, broadcasts, notifications.
- TC-COM-AUDIT: audit-center trace drill-down.
- TC-COM-TRACE: trace-explorer renders.
- TC-COM-TESTER: message-tester sends a test message.
- TC-COM-GRAPH: flow-graph topology renders.
- TC-COM-MAP: mapping editor loads (canonical↔AE).
- TC-COM-ROUTING: routing table CRUD.
- TC-COM-AE: AE channel config tabs render.

Endpoints: `/{resource}` CRUD, GET `/v1/flow/traces`, GET `/v1/flow/audit/{id}`, GET
`/flow/topology`, POST `/v1/flow/messages`, GET `/v1/mappings`,
GET `/v1/routing/tables/default-routing/routes`.

---

## 10. Damorex — 48 tests (project `public`)

- **Browse smoke (~20):** homepage, shop, product detail, categories(+detail), search,
  health-concerns(+detail), blog(+article), branches(+detail), delivery-areas, rewards, about, faq,
  privacy, terms, contact — page renders key content.
- **Commerce (~12):**
  - TC-DMX-CART: add to cart → cart badge; remove.
  - TC-DMX-CHECKOUT: cart → checkout → order created (cleanup).
  - TC-DMX-ORDERS: orders list + detail render; track-order by code.
  - TC-DMX-PRESC: my-prescriptions + upload-prescription.
  - TC-DMX-CONS: consultations list + book.
  - TC-DMX-LOGIN: damorex login/forgot-password forms.
- **POS/PO (~16):**
  - TC-DMX-POS: add products → cart → payment modal → complete sale (POST /sales; cleanup).
  - TC-DMX-POS2: pos2 responsive sale flow.
  - TC-DMX-PO: purchases list, create PO, edit PO (unique name + cleanup).

Endpoints: GET homepage/products/categories/health-concerns/blog/branches/orders/rewards/search;
POST `/sales`, GET `/sales`; GET/POST/PUT `/purchases[/{id}]`.

---

## 11. Clerk & Questionnaire — 8 tests (project `public`)

- TC-CLK-01: `/clerk` renders outlet.
- TC-CLK-02: clerk auth layout renders.
- TC-CLK-03: `/clerk/_authenticated/user-management` renders.
- TC-Q-01..03: questionnaire load, create conversation, process response.

---

## Totals (in-scope; APM removed)

| Project | Test count |
|---|---|
| public | ~17 |
| admin | ~84 |
| admin-modules | ~125 (each gated by module access + backend health) |
| **Total** | **~226** |
