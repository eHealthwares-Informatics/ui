# Tracker Status — RxSoft Alpha Test Plan

> Generated 2026-09-27T17:38:40.038Z · board: https://github.com/users/ehealthwares/projects/1 · items: 22 epics / 116 entity tasks / 593 use cases

**Storage state:** ✅ admin storageState is fresh (1.0h old).

| State | Meaning |
|---|---|
| covered | spec exists and runs unconditionally |
| gated | spec exists but auto-skips when a backend/module is down |
| missing | no spec found for the TC (declared path noted where present) |
| missing-path | UC issue does not declare a spec path for the TC — unmappable, fix the issue body |

## Totals

| Covered | Gated | Missing | Missing-path | TCs mapped | Coverage (of mappable) |
|---|---|---|---|---|---|
| 12 | 4 | 2075 | 0 | 2091 | 0.8% |

## Per-phase matrix

| Phase | UCs | UCs complete | Covered | Gated | Missing | Missing-path |
|---|---|---|---|---|---|---|
| 0-baseline | 1 | 1 | 12 | 4 | 0 | 0 |
| 1-rxsoft-crud | 87 | 0 | 0 | 0 | 290 | 0 |
| 2-catalog | 48 | 0 | 0 | 0 | 166 | 0 |
| 3-operations | 47 | 0 | 0 | 0 | 158 | 0 |
| 4-commerce | 65 | 0 | 0 | 0 | 210 | 0 |
| 5-modules | 360 | 0 | 0 | 0 | 1251 | 0 |

## Entity rollup

| Module | Entity | Phase | TCs done / total | Complete | Issue |
|---|---|---|---|---|---|
| ehealthwares | [ehealthwares] Articles — E2E | 5-modules | 0/21 | — | [#320](ehealthwares/rxsoft/issues/320) |
| ehealthwares | [ehealthwares] Careers — E2E | 5-modules | 0/21 | — | [#327](ehealthwares/rxsoft/issues/327) |
| ehealthwares | [ehealthwares] Categories — E2E | 5-modules | 0/21 | — | [#334](ehealthwares/rxsoft/issues/334) |
| ehealthwares | [ehealthwares] Contact Submissions — E2E | 5-modules | 0/21 | — | [#341](ehealthwares/rxsoft/issues/341) |
| ehealthwares | [ehealthwares] Hero Slides — E2E | 5-modules | 0/21 | — | [#348](ehealthwares/rxsoft/issues/348) |
| ehealthwares | [ehealthwares] Investors — E2E | 5-modules | 0/21 | — | [#355](ehealthwares/rxsoft/issues/355) |
| ehealthwares | [ehealthwares] Partners — E2E | 5-modules | 0/21 | — | [#362](ehealthwares/rxsoft/issues/362) |
| ehealthwares | [ehealthwares] Products — E2E | 5-modules | 0/21 | — | [#369](ehealthwares/rxsoft/issues/369) |
| ehealthwares | [ehealthwares] Sections — E2E | 5-modules | 0/21 | — | [#376](ehealthwares/rxsoft/issues/376) |
| ehealthwares | [ehealthwares] Services — E2E | 5-modules | 0/21 | — | [#383](ehealthwares/rxsoft/issues/383) |
| ehealthwares | [ehealthwares] Settings — E2E | 5-modules | 0/21 | — | [#390](ehealthwares/rxsoft/issues/390) |
| ehealthwares | [ehealthwares] Team — E2E | 5-modules | 0/21 | — | [#397](ehealthwares/rxsoft/issues/397) |
| ehealthwares | [ehealthwares] Testimonials — E2E | 5-modules | 0/21 | — | [#404](ehealthwares/rxsoft/issues/404) |
| emr | [emr] Admissions — E2E | 5-modules | 0/21 | — | [#480](ehealthwares/rxsoft/issues/480) |
| emr | [emr] Appointments — E2E | 5-modules | 0/25 | — | [#426](ehealthwares/rxsoft/issues/426) |
| emr | [emr] Beds — E2E | 5-modules | 0/21 | — | [#473](ehealthwares/rxsoft/issues/473) |
| emr | [emr] Clinical Requests — E2E | 5-modules | 0/25 | — | [#458](ehealthwares/rxsoft/issues/458) |
| emr | [emr] Dashboard — E2E | 5-modules | 0/2 | — | [#523](ehealthwares/rxsoft/issues/523) |
| emr | [emr] Departments — E2E | 5-modules | 0/21 | — | [#495](ehealthwares/rxsoft/issues/495) |
| emr | [emr] Discharges — E2E | 5-modules | 0/21 | — | [#488](ehealthwares/rxsoft/issues/488) |
| emr | [emr] Encounters — E2E | 5-modules | 0/23 | — | [#441](ehealthwares/rxsoft/issues/441) |
| emr | [emr] Forms & Documentation — E2E | 5-modules | 0/27 | — | [#449](ehealthwares/rxsoft/issues/449) |
| emr | [emr] Medications — E2E | 5-modules | 0/21 | — | [#502](ehealthwares/rxsoft/issues/502) |
| emr | [emr] Patients — E2E | 5-modules | 0/24 | — | [#411](ehealthwares/rxsoft/issues/411) |
| emr | [emr] Referrals — E2E | 5-modules | 0/21 | — | [#509](ehealthwares/rxsoft/issues/509) |
| emr | [emr] Staff — E2E | 5-modules | 0/21 | — | [#419](ehealthwares/rxsoft/issues/419) |
| emr | [emr] Tags — E2E | 5-modules | 0/21 | — | [#516](ehealthwares/rxsoft/issues/516) |
| emr | [emr] Visits — E2E | 5-modules | 0/21 | — | [#434](ehealthwares/rxsoft/issues/434) |
| emr | [emr] Wards — E2E | 5-modules | 0/21 | — | [#466](ehealthwares/rxsoft/issues/466) |
| lis | [lis] Attribute Definitions — E2E | 5-modules | 0/21 | — | [#609](ehealthwares/rxsoft/issues/609) |
| lis | [lis] EQA Enrollments — E2E | 5-modules | 0/21 | — | [#707](ehealthwares/rxsoft/issues/707) |
| lis | [lis] EQA Programs — E2E | 5-modules | 0/21 | — | [#700](ehealthwares/rxsoft/issues/700) |
| lis | [lis] EQA Results — E2E | 5-modules | 0/21 | — | [#714](ehealthwares/rxsoft/issues/714) |
| lis | [lis] LIS Hub Navigation — E2E | 5-modules | 0/2 | — | [#738](ehealthwares/rxsoft/issues/738) |
| lis | [lis] Location Types — E2E | 5-modules | 0/21 | — | [#595](ehealthwares/rxsoft/issues/595) |
| lis | [lis] Locations — E2E | 5-modules | 0/21 | — | [#602](ehealthwares/rxsoft/issues/602) |
| lis | [lis] LOINC — E2E | 5-modules | 0/21 | — | [#539](ehealthwares/rxsoft/issues/539) |
| lis | [lis] Methods — E2E | 5-modules | 0/21 | — | [#644](ehealthwares/rxsoft/issues/644) |
| lis | [lis] Order Report Builder — E2E | 5-modules | 0/3 | — | [#734](ehealthwares/rxsoft/issues/734) |
| lis | [lis] Orders — 5-Step Workflow — E2E | 5-modules | 0/5 | — | [#728](ehealthwares/rxsoft/issues/728) |
| lis | [lis] Orders — E2E | 5-modules | 0/21 | — | [#574](ehealthwares/rxsoft/issues/574) |
| lis | [lis] Orders Dashboard — E2E | 5-modules | 0/1 | — | [#730](ehealthwares/rxsoft/issues/730) |
| lis | [lis] Panels — E2E | 5-modules | 0/21 | — | [#581](ehealthwares/rxsoft/issues/581) |
| lis | [lis] Patients — E2E | 5-modules | 0/21 | — | [#546](ehealthwares/rxsoft/issues/546) |
| lis | [lis] Priorities — E2E | 5-modules | 0/21 | — | [#623](ehealthwares/rxsoft/issues/623) |
| lis | [lis] Programs — E2E | 5-modules | 0/21 | — | [#588](ehealthwares/rxsoft/issues/588) |
| lis | [lis] QA Checklist Items — E2E | 5-modules | 0/21 | — | [#672](ehealthwares/rxsoft/issues/672) |
| lis | [lis] QC Alerts — E2E | 5-modules | 0/21 | — | [#693](ehealthwares/rxsoft/issues/693) |
| lis | [lis] QC Lots — E2E | 5-modules | 0/21 | — | [#679](ehealthwares/rxsoft/issues/679) |
| lis | [lis] QC Results — E2E | 5-modules | 0/21 | — | [#686](ehealthwares/rxsoft/issues/686) |
| lis | [lis] Reference Range Coverage — E2E | 5-modules | 0/1 | — | [#736](ehealthwares/rxsoft/issues/736) |
| lis | [lis] Reference Ranges — E2E | 5-modules | 0/21 | — | [#532](ehealthwares/rxsoft/issues/532) |
| lis | [lis] Rejection Reasons — E2E | 5-modules | 0/21 | — | [#721](ehealthwares/rxsoft/issues/721) |
| lis | [lis] Result Signatures — E2E | 5-modules | 0/21 | — | [#567](ehealthwares/rxsoft/issues/567) |
| lis | [lis] Results — E2E | 5-modules | 0/21 | — | [#560](ehealthwares/rxsoft/issues/560) |
| lis | [lis] Sample Types — E2E | 5-modules | 0/21 | — | [#616](ehealthwares/rxsoft/issues/616) |
| lis | [lis] Samples — E2E | 5-modules | 0/21 | — | [#553](ehealthwares/rxsoft/issues/553) |
| lis | [lis] Status History — E2E | 5-modules | 0/21 | — | [#665](ehealthwares/rxsoft/issues/665) |
| lis | [lis] Statuses — E2E | 5-modules | 0/21 | — | [#658](ehealthwares/rxsoft/issues/658) |
| lis | [lis] Test Categories — E2E | 5-modules | 0/21 | — | [#630](ehealthwares/rxsoft/issues/630) |
| lis | [lis] Test Definitions — E2E | 5-modules | 0/21 | — | [#525](ehealthwares/rxsoft/issues/525) |
| lis | [lis] Test Sections — E2E | 5-modules | 0/21 | — | [#637](ehealthwares/rxsoft/issues/637) |
| lis | [lis] UOMs — E2E | 5-modules | 0/21 | — | [#651](ehealthwares/rxsoft/issues/651) |
| lis | [lis] Validation Dashboard — E2E | 5-modules | 0/1 | — | [#732](ehealthwares/rxsoft/issues/732) |
| rxsoft | [rxsoft] Audit Logs — E2E | 1-rxsoft-crud | 0/12 | — | [#273](ehealthwares/rxsoft/issues/273) |
| rxsoft | [rxsoft] Balance Sheet — E2E | 4-commerce | 0/3 | — | [#195](ehealthwares/rxsoft/issues/195) |
| rxsoft | [rxsoft] Branches — E2E | 1-rxsoft-crud | 0/16 | — | [#245](ehealthwares/rxsoft/issues/245) |
| rxsoft | [rxsoft] Categories — E2E | 2-catalog | 0/15 | — | [#35](ehealthwares/rxsoft/issues/35) |
| rxsoft | [rxsoft] Customers — E2E | 1-rxsoft-crud | 0/17 | — | [#251](ehealthwares/rxsoft/issues/251) |
| rxsoft | [rxsoft] Dashboard — E2E | 4-commerce | 0/2 | — | [#191](ehealthwares/rxsoft/issues/191) |
| rxsoft | [rxsoft] Drug Components — E2E | 1-rxsoft-crud | 0/12 | — | [#268](ehealthwares/rxsoft/issues/268) |
| rxsoft | [rxsoft] Full Business Flow (end-to-end) — E2E | 4-commerce | 0/6 | — | [#211](ehealthwares/rxsoft/issues/211) |
| rxsoft | [rxsoft] GL Accounts — E2E | 1-rxsoft-crud | 0/21 | — | [#278](ehealthwares/rxsoft/issues/278) |
| rxsoft | [rxsoft] Income Statement — E2E | 4-commerce | 0/3 | — | [#197](ehealthwares/rxsoft/issues/197) |
| rxsoft | [rxsoft] Insurance Providers — E2E | 1-rxsoft-crud | 0/21 | — | [#309](ehealthwares/rxsoft/issues/309) |
| rxsoft | [rxsoft] Inventory — E2E | 3-operations | 0/16 | — | [#86](ehealthwares/rxsoft/issues/86) |
| rxsoft | [rxsoft] Items — E2E | 2-catalog | 0/24 | — | [#28](ehealthwares/rxsoft/issues/28) |
| rxsoft | [rxsoft] Journal Entries — E2E | 1-rxsoft-crud | 0/21 | — | [#292](ehealthwares/rxsoft/issues/292) |
| rxsoft | [rxsoft] Journal Entry Lines — E2E | 1-rxsoft-crud | 0/12 | — | [#299](ehealthwares/rxsoft/issues/299) |
| rxsoft | [rxsoft] Journals — E2E | 1-rxsoft-crud | 0/21 | — | [#285](ehealthwares/rxsoft/issues/285) |
| rxsoft | [rxsoft] Manufacturers — E2E | 1-rxsoft-crud | 0/21 | — | [#257](ehealthwares/rxsoft/issues/257) |
| rxsoft | [rxsoft] Organisation Config — E2E | 1-rxsoft-crud | 0/13 | — | [#240](ehealthwares/rxsoft/issues/240) |
| rxsoft | [rxsoft] Organisation Payment Providers — E2E | 4-commerce | 0/21 | — | [#149](ehealthwares/rxsoft/issues/149) |
| rxsoft | [rxsoft] Organizations — E2E | 1-rxsoft-crud | 0/21 | — | [#233](ehealthwares/rxsoft/issues/233) |
| rxsoft | [rxsoft] Payment Methods — E2E | 4-commerce | 0/21 | — | [#161](ehealthwares/rxsoft/issues/161) |
| rxsoft | [rxsoft] Payment Providers — E2E | 4-commerce | 0/21 | — | [#142](ehealthwares/rxsoft/issues/142) |
| rxsoft | [rxsoft] Payment Transactions — E2E | 4-commerce | 0/12 | — | [#156](ehealthwares/rxsoft/issues/156) |
| rxsoft | [rxsoft] Payments — E2E | 4-commerce | 0/21 | — | [#135](ehealthwares/rxsoft/issues/135) |
| rxsoft | [rxsoft] Pharmaceutics — E2E | 1-rxsoft-crud | 0/10 | — | [#264](ehealthwares/rxsoft/issues/264) |
| rxsoft | [rxsoft] POS Terminals — E2E | 2-catalog | 0/21 | — | [#79](ehealthwares/rxsoft/issues/79) |
| rxsoft | [rxsoft] Price List Items — E2E | 2-catalog | 0/21 | — | [#48](ehealthwares/rxsoft/issues/48) |
| rxsoft | [rxsoft] Price Lists — E2E | 2-catalog | 0/21 | — | [#41](ehealthwares/rxsoft/issues/41) |
| rxsoft | [rxsoft] Products — E2E | 2-catalog | 0/21 | — | [#72](ehealthwares/rxsoft/issues/72) |
| rxsoft | [rxsoft] Purchases — E2E | 3-operations | 0/21 | — | [#104](ehealthwares/rxsoft/issues/104) |
| rxsoft | [rxsoft] Purchases Analytics — E2E | 4-commerce | 0/12 | — | [#206](ehealthwares/rxsoft/issues/206) |
| rxsoft | [rxsoft] Receivables — E2E | 1-rxsoft-crud | 0/12 | — | [#304](ehealthwares/rxsoft/issues/304) |
| rxsoft | [rxsoft] Receiving — E2E | 3-operations | 0/13 | — | [#111](ehealthwares/rxsoft/issues/111) |
| rxsoft | [rxsoft] Reports — E2E | 4-commerce | 0/2 | — | [#193](ehealthwares/rxsoft/issues/193) |
| rxsoft | [rxsoft] Reset Password — E2E | 1-rxsoft-crud | 0/2 | — | [#318](ehealthwares/rxsoft/issues/318) |
| rxsoft | [rxsoft] Role Requests — E2E | 3-operations | 0/21 | — | [#184](ehealthwares/rxsoft/issues/184) |
| rxsoft | [rxsoft] Roles — E2E | 3-operations | 0/24 | — | [#176](ehealthwares/rxsoft/issues/176) |
| rxsoft | [rxsoft] Sales — E2E | 4-commerce | 0/21 | — | [#123](ehealthwares/rxsoft/issues/123) |
| rxsoft | [rxsoft] Sales Analytics — E2E | 4-commerce | 0/12 | — | [#201](ehealthwares/rxsoft/issues/201) |
| rxsoft | [rxsoft] Sales Lines — E2E | 4-commerce | 0/12 | — | [#130](ehealthwares/rxsoft/issues/130) |
| rxsoft | [rxsoft] Settings (account/appearance/display/notifications) — E2E | 1-rxsoft-crud | 0/4 | — | [#316](ehealthwares/rxsoft/issues/316) |
| rxsoft | [rxsoft] Stock Locations — E2E | 3-operations | 0/21 | — | [#92](ehealthwares/rxsoft/issues/92) |
| rxsoft | [rxsoft] Suppliers — E2E | 3-operations | 0/21 | — | [#116](ehealthwares/rxsoft/issues/116) |
| rxsoft | [rxsoft] Trial Balance — E2E | 4-commerce | 0/3 | — | [#199](ehealthwares/rxsoft/issues/199) |
| rxsoft | [rxsoft] UOM Categories — E2E | 2-catalog | 0/21 | — | [#65](ehealthwares/rxsoft/issues/65) |
| rxsoft | [rxsoft] UOMs — E2E | 2-catalog | 0/21 | — | [#55](ehealthwares/rxsoft/issues/55) |
| rxsoft | [rxsoft] User Config — E2E | 1-rxsoft-crud | 0/21 | — | [#221](ehealthwares/rxsoft/issues/221) |
| rxsoft | [rxsoft] User Insights — E2E | 1-rxsoft-crud | 0/12 | — | [#228](ehealthwares/rxsoft/issues/228) |
| rxsoft | [rxsoft] Users — E2E | 1-rxsoft-crud | 0/21 | — | [#214](ehealthwares/rxsoft/issues/214) |
| rxsoft | [rxsoft] Warehouses — E2E | 3-operations | 0/15 | — | [#99](ehealthwares/rxsoft/issues/99) |
| rxsoft | [rxsoft] Website Orders — E2E | 4-commerce | 0/10 | — | [#168](ehealthwares/rxsoft/issues/168) |
| rxsoft | [rxsoft] Website Prescriptions — E2E | 4-commerce | 0/10 | — | [#172](ehealthwares/rxsoft/issues/172) |

## Gated spec files

- crud-suite/run-crud.spec.ts
- tests/auth/sign-in.spec.ts
- tests/communication/module.spec.ts
- tests/conversation/module.spec.ts
- tests/lis/module.spec.ts
