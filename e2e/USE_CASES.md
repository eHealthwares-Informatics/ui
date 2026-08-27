# Use Cases by Module

> **Scope note (current):** APM website/admin are **out of scope** — their specs were removed.
> Sections 2 & 3 below are retained only as historical reference and are NOT tested.

Template per use case:
`UC-<MOD>-<NN> — <page/route> — <user story (who/what/why)> | auth: public|admin | endpoints`

Auth legend: **public** = no login; **admin** = requires a valid token (storageState).

---

## 1. Auth & Root (13 use cases)

| ID | Route | Use case | Auth |
|---|---|---|---|
| UC-AUTH-01 | /sign-in | Admin logs in with valid credentials and is taken into the app | public |
| UC-AUTH-02 | /sign-in | Admin sees an inline error on wrong credentials | public |
| UC-AUTH-03 | /sign-in | Validation errors shown for empty username/password | public |
| UC-AUTH-04 | /sign-in | Preserves `?redirect=` target after login (e.g. back to /apm/admin/lgas) | public |
| UC-AUTH-05 | /sign-in-2 | Alternate sign-in variant renders its form | public |
| UC-AUTH-06 | /sign-up | Visitor registers an account | public |
| UC-AUTH-07 | /forgot-password | Visitor requests a password reset | public |
| UC-AUTH-08 | /otp | Visitor enters a one-time passcode | public |
| UC-ERR-01..06 | /401 /403 /404 /500 /503 /service-unavailable | Each error page renders the correct status heading/message | public |
| UC-ROOT-01 | / | Unauthenticated visitor is redirected to /sign-in | public |
| UC-ROOT-02 | / | Authenticated admin is redirected to a module root | admin |

Endpoints: `POST {identity}/auth/login`, `GET {identity}/auth/me`, `POST {identity}/auth/refresh-token`.

---

## 2. APM — Public Website (12 pages, 12 use cases) — OUT OF SCOPE (historical)

| ID | Route | Use case | Auth |
|---|---|---|---|
| UC-APMW-01 | /apm | Visitor sees the homepage hero and sections | public |
| UC-APMW-02 | /apm/achievements | Visitor browses achievements | public |
| UC-APMW-03 | /apm/agenda | Visitor browses the agenda | public |
| UC-APMW-04 | /apm/contact | Visitor submits the contact form | public |
| UC-APMW-05 | /apm/events | Visitor browses the events list | public |
| UC-APMW-06 | /apm/events/$id | Visitor views an event detail page | public |
| UC-APMW-07 | /apm/join | Visitor submits the join form | public |
| UC-APMW-08 | /apm/media | Visitor browses media | public |
| UC-APMW-09 | /apm/meet | Visitor views the Meet Adekanmbi page | public |
| UC-APMW-10 | /apm/news | Visitor browses the news list | public |
| UC-APMW-11 | /apm/news/$slug | Visitor reads a news article | public |
| UC-APMW-12 | /apm/volunteer | Visitor submits the volunteer form | public |

Endpoints (`features/apm/website/api.ts`, `VITE_API_URL`): GET `/apm/homepage`, `/apm/agenda`,
`/apm/achievements`, `/apm/news`, `/apm/news/{slug}`, `/apm/events`, `/apm/events/{id}`; POST
contact/join/volunteer/event-registration.

---

## 3. APM — Admin (17 pages, 18 use cases) — OUT OF SCOPE (historical)

All under `/apm/admin` layout, whose `beforeLoad` requires `getAccessToken()` → redirect to
`/sign-in` otherwise. **Auth: admin.**

| ID | Route | Use case |
|---|---|---|
| UC-APMA-01 | /apm/admin (layout) | Admin navigates the admin nav to all sections |
| UC-APMA-02 | /apm/admin/lgas | Admin views all LGAs (name, code, score, status, wards, PUs, friendly PUs) and updates a score via modal (target of the phone/LAN fix) |
| UC-APMA-03 | /apm/admin/wards/$lgaId | Admin drills into an LGA's wards |
| UC-APMA-04 | /apm/admin/polling-units/$wardId | Admin drills into a ward's polling units |
| UC-APMA-05 | /apm/admin/conversion | Admin views the conversion dashboard |
| UC-APMA-06 | /apm/admin/agents | Admin lists, creates, and updates agents |
| UC-APMA-07 | /apm/admin/canvassing | Admin views canvassing stats and sessions |
| UC-APMA-08 | /apm/admin/content | Admin manages content assets |
| UC-APMA-09 | /apm/admin/gotv | Admin lists GOTV records |
| UC-APMA-10 | /apm/admin/incidents | Admin lists, creates, and updates incidents |
| UC-APMA-11 | /apm/admin/listening | Admin manages listening mentions |
| UC-APMA-12 | /apm/admin/results | Admin lists and verifies results |
| UC-APMA-13 | /apm/admin/sentiment | Admin views the sentiment dashboard |
| UC-APMA-14 | /apm/admin/stakeholders | Admin lists and creates stakeholders |
| UC-APMA-15 | /apm/admin/tours | Admin manages candidate tours |
| UC-APMA-16 | /apm/admin/volunteers | Admin views volunteer assignments |
| UC-APMA-17 | /apm/admin/whatsapp | Admin manages WhatsApp groups |

Endpoints (`features/apm/website/admin-api.ts` via `rxsoftApi`): GET `/apm/data/lgas`,
`/apm/data/lgas/{id}/wards`, `/apm/data/wards/{id}/polling-units`, `/apm/conversion/dashboard`,
`/apm/conversion/lgas`, `/apm/conversion/wards/{id}`, PUT `/apm/conversion/score/lga/{id}`;
GET/POST/PUT `/apm/agents`, `/apm/incidents`, `/apm/stakeholders`, `/apm/whatsapp/groups`,
`/apm/tours`, `/apm/listening`, `/apm/gotv`, `/apm/results`, `/apm/canvassing/*`, `/apm/content`,
`/apm/sentiment`, `/apm/volunteer-assignments`.

---

## 4. RxSoft (44 routes, ~52 use cases)

**Auth: admin.** Backend `:8080`, Postgres-seeded.

| Group | Routes | Use case |
|---|---|---|
| Dashboard | /rxsoft/dashboard | Admin views daily sales, inventory valuation, and top-selling products |
| CRUD (DataPageShell) | audit-logs, branches, categories, customers, drug-components, gl-accounts, inventory, items (+/items/create), journal-entries, journal-entry-lines, journals, manufacturers, organizations, payment-methods, pharmaceutics, price-list-items, price-lists, purchases, receivables, roles, sales, stock-locations, suppliers, uom-category, uoms (+uoms/$uomId, +/edit), users, warehouses | Admin lists, searches, paginates, creates, edits, deletes, and exports each resource |
| Bespoke | receiving (unpost PO), website-orders (status transitions), roles/$id/permissions (tri-level toggles + save), reports (+export), balance-sheet / income-statement / trial-balance (date-range filter + CSV export), settings/* (index, account, appearance, display, notifications), reset-password | Admin performs the page's dedicated action |

Endpoints: GET `/{resource}?search&limit&offset`, POST/PUT/DELETE `/{resource}`, GET
`/{resource}/export`, GET `/{resource}/metrics`, GET `/reports/daily-sales`,
`/reports/inventory-valuation`, `/reports/top-selling-products`, `/reports/trial-balance`,
`/reports/balance-sheet`, `/reports/income-statement`, POST `/website/admin/complete-sale/{id}`,
POST `/purchases/{id}/unpost`, POST `/inventory/transfers`, GET `/permissions/modules`,
GET/PUT `/roles/{id}`.

---

## 5. EMR (7 pages, ~8 use cases) — **admin**, backend `:8093`

| ID | Route | Use case |
|---|---|---|
| UC-EMR-01 | /emr | Admin views the EMR dashboard summary |
| UC-EMR-02..07 | /emr/patients, /emr/appointments, /emr/visits, /emr/encounters, /emr/forms, /emr/requests | Admin lists/searches each resource (config-driven CRUD via `emrApi`) |

Endpoints: GET `/dashboard`, GET `/{resource}` (patients, appointments, visits, encounters,
forms, requests).

---

## 6. LIS (38 pages, ~45 use cases) — **admin**, backend `:8002`

| Group | Routes | Use case |
|---|---|---|
| Hub | /lis | Admin navigates the resource grid to all sections |
| CRUD (LisResourcePage) | test-definitions, reference-ranges (+coverage), loinc, patients, samples, results, result-signatures, orders, panels, programs, location-types, locations, attribute-definitions, sample-types, priorities, test-categories, test-sections, methods, uoms, statuses, qa-checklist-items, qc-lots, qc-results, qc-alerts, eqa-programs, eqa-enrollments, eqa-results, rejection-reasons | Admin lists/searches/creates/edits/deletes each resource |
| Orders workflow | /lis/orders/workflow (Enter→Collect→Label→QA→Order) | Admin creates an order through the 5-step stepper |
| Dashboard | /lis/orders/dashboard | Admin views lab metrics |
| Report | /lis/orders/$orderId/report | Admin adds results + signature and sends the report |
| Validation | /lis/validation-dashboard | Admin views validation dashboard |

Endpoints: GET/POST/PATCH `/lis/orders`, GET `/lis/dashboard/metrics`, GET
`/lis/reference-ranges/coverage/{testId}`, POST `/lis/results`, POST `/lis/result-signatures`,
POST `/lis/orders/{id}/send-report`, plus per-resource CRUD.

---

## 7. Conversation (17 pages, ~22 use cases) — **admin**, backend `:8090`

| Group | Routes | Use case |
|---|---|---|
| CRUD (DataPageShell) | /conversation/channels, /conversations, /exchanges, /option-lists, /participants, /projections, /questions, /questionnaires, /workflows, /workflow-instances, /workflow-events, /workflow-configuration | Admin manages each resource |
| Chats | /conversation/chats | Admin opens inbox, scrolls messages, sends a reply |
| Exchange detail | /conversation/exchanges/$exchangeId | Admin views an exchange thread |
| Edit routes | /conversation/$conversationId/edit, /conversation/$page/$id/edit | Admin edits an entity |
| Public questionnaire | /questionnaire | Visitor loads a questionnaire, creates a conversation, processes a response (public, no auth) |

Endpoints: GET `/conversations/inbox`, GET `/exchanges`, GET `/participants`,
GET/POST `/conversations[/{id}]`, POST `/conversations/{id}/process-response`,
POST `/channels/send-message`, plus per-resource CRUD.

---

## 8. Coding-Concept (13 pages, ~16 use cases) — **admin**, backend `:8004`

| ID | Route | Use case |
|---|---|---|
| UC-CC-01 | /coding-concept/search | Admin searches coded concepts |
| UC-CC-02 | /coding-concept/match | Admin matches a concept |
| UC-CC-03 | /coding-concept/upload | Admin uploads codes/values |
| UC-CC-04..13 | /coding-concept/drug-components, /pharmaceutics, /generic-drugs, /facilities, /facilities/levels, /facilities/lgas, /facilities/states, /facilities/types, /facilities/wards | Admin lists/searches each coded reference |

Endpoints: GET (search/match), POST `/concepts/upload/codes`, POST `/concepts/upload/values`,
per-resource CRUD.

---

## 9. Communication (13 pages, ~16 use cases) — **admin**, backend `:8003`

| Group | Routes | Use case |
|---|---|---|
| CRUD | /communication/messages, /message-templates, /notification-templates, /communication-channels, /message-logs, /broadcasts, /notifications | Admin manages each resource |
| Custom | /communication/audit-center (trace drill-down), /trace-explorer, /flow-graph (topology), /message-tester (send test message), /mapping (canonical↔AE mapping editor), /routing (routing table CRUD), /aes (AE channel config) | Admin uses the page's dedicated tool |

Endpoints: `/{resource}` CRUD, GET `/v1/flow/traces`, GET `/v1/flow/audit/{id}`, GET
`/flow/topology`, POST `/v1/flow/messages`, GET `/v1/mappings`, GET
`/v1/routing/tables/default-routing/routes`.

---

## 10. Damorex (34 pages, ~42 use cases) — **public**

| Group | Routes | Use case |
|---|---|---|
| Browse | /damorex (homepage), /shop, /shop/$slug, /categories, /categories/$slug, /search, /health-concerns, /health-concerns/$slug, /blog, /blog/$slug, /branches, /branches/$id, /delivery-areas, /rewards, /about, /faq, /privacy-policy, /terms | Visitor browses content |
| Commerce | /cart (add/remove), /checkout, /orders, /orders/$id, /track-order/$code, /my-prescriptions, /upload-prescription, /consultations, /consult-pharmacist, /login, /forgot-password | Visitor completes a shopping/order flow |
| POS | /damorex/pos, /damorex/pos2 | Cashier creates a sale (cart, payment modal, invoice) |
| PO | /damorex/purchases | Staff lists/creates/updates purchase orders |

Endpoints (`features/damorex/website/api.ts` + `posApi`/`poApi`): GET homepage/products/
categories/health-concerns/blog/branches/orders/rewards/search; POST `/sales`, GET `/sales`;
GET/POST/PUT `/purchases[/{id}]`.

---

## 11. Clerk & Questionnaire (5 use cases)

| ID | Route | Use case | Auth |
|---|---|---|---|
| UC-CLK-01 | /clerk | Bare clerk route renders outlet | public |
| UC-CLK-02 | /clerk/(auth) | Clerk demo auth layout renders | public |
| UC-CLK-03 | /clerk/_authenticated/user-management | User management page renders (note: layout has no guard) | public |
| UC-Q-01..02 | /questionnaire | Visitor loads the questionnaire and creates/processes a conversation | public |

---

## Summary

- **In-scope modules:** Auth/Errors/Root, RxSoft, Damorex, LIS, Conversation, Coding-Concept,
  Communication, EMR, Clerk, Questionnaire. **APM website/admin are out of scope.**
- **Pages covered (in-scope):** ~180 route files.
- **Use cases (in-scope):** ~218 (APM's 30 removed).
