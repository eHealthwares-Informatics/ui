# GitHub Tracker Manifest — RxSoft Alpha Test Plan

Generated: 2026-09-27T10:01:11.776Z

Hierarchy: **Epic (existing issue) → Entity task → Use-case sub-issue**.
Each use-case sub-issue carries its test cases as a markdown checklist (no separate TC issues).

## Epics

| # | Epic |
|---|---|
| 2 | RxSoft — CRUD suite runner (generic, all resources) |
| 3 | RxSoft — Items creation wizard |
| 4 | RxSoft — Inventory (adjust, transfer) |
| 5 | RxSoft — Dashboard, Reports & Financial statements |
| 6 | RxSoft — Roles & Permissions |
| 7 | RxSoft — Sales, POS & Complete-Sale flow |
| 8 | RxSoft — Full business flow (end-to-end) |
| 9 | RxSoft — Purchases, Receiving & PO unpost |
| 10 | EMR — Mocked module |
| 15 | LIS — CRUD suite |
| 16 | LIS — Order workflow & bespoke tests |
| 22 | RxSoft · eHealthwares CMS — content entities |

## Entities

| Module | Entity | Epic # | Task issue | Use cases | UC issues | Test cases |
|---|---|---|---|---|---|---|
| rxsoft | Items | 3 | [#28](https://github.com/ehealthwares/rxsoft/issues/28) | 6 | #29, #30, #31, #32, #33, #34 | 24 |
| rxsoft | Categories | 3 | [#35](https://github.com/ehealthwares/rxsoft/issues/35) | 5 | #36, #37, #38, #39, #40 | 15 |
| rxsoft | Price Lists | 3 | [#41](https://github.com/ehealthwares/rxsoft/issues/41) | 6 | #42, #43, #44, #45, #46, #47 | 21 |
| rxsoft | Price List Items | 3 | [#48](https://github.com/ehealthwares/rxsoft/issues/48) | 6 | #49, #50, #51, #52, #53, #54 | 21 |
| rxsoft | UOMs | 3 | [#55](https://github.com/ehealthwares/rxsoft/issues/55) | 6 | #56, #57, #58, #62, #63, #64 | 21 |
| rxsoft | UOM Categories | 3 | [#65](https://github.com/ehealthwares/rxsoft/issues/65) | 6 | #66, #67, #68, #69, #70, #71 | 21 |
| rxsoft | Products | 3 | [#72](https://github.com/ehealthwares/rxsoft/issues/72) | 6 | #73, #74, #75, #76, #77, #78 | 21 |
| rxsoft | POS Terminals | 3 | [#79](https://github.com/ehealthwares/rxsoft/issues/79) | 6 | #80, #81, #82, #83, #84, #85 | 21 |
| rxsoft | Inventory | 4 | [#86](https://github.com/ehealthwares/rxsoft/issues/86) | 5 | #87, #88, #89, #90, #91 | 16 |
| rxsoft | Stock Locations | 4 | [#92](https://github.com/ehealthwares/rxsoft/issues/92) | 6 | #93, #94, #95, #96, #97, #98 | 21 |
| rxsoft | Warehouses | 4 | [#99](https://github.com/ehealthwares/rxsoft/issues/99) | 4 | #100, #101, #102, #103 | 15 |
| rxsoft | Purchases | 9 | [#104](https://github.com/ehealthwares/rxsoft/issues/104) | 6 | #105, #106, #107, #108, #109, #110 | 21 |
| rxsoft | Receiving | 9 | [#111](https://github.com/ehealthwares/rxsoft/issues/111) | 4 | #112, #113, #114, #115 | 13 |
| rxsoft | Suppliers | 9 | [#116](https://github.com/ehealthwares/rxsoft/issues/116) | 6 | #117, #118, #119, #120, #121, #122 | 21 |
| rxsoft | Sales | 7 | [#123](https://github.com/ehealthwares/rxsoft/issues/123) | 7 | #124, #125, #126, #127, #128, #129, #740 | 27 |
| rxsoft | Sales Lines | 7 | [#130](https://github.com/ehealthwares/rxsoft/issues/130) | 4 | #131, #132, #133, #134 | 12 |
| rxsoft | Payments | 7 | [#135](https://github.com/ehealthwares/rxsoft/issues/135) | 6 | #136, #137, #138, #139, #140, #141 | 21 |
| rxsoft | Payment Providers | 7 | [#142](https://github.com/ehealthwares/rxsoft/issues/142) | 6 | #143, #144, #145, #146, #147, #148 | 21 |
| rxsoft | Organisation Payment Providers | 7 | [#149](https://github.com/ehealthwares/rxsoft/issues/149) | 6 | #150, #151, #152, #153, #154, #155 | 21 |
| rxsoft | Payment Transactions | 7 | [#156](https://github.com/ehealthwares/rxsoft/issues/156) | 4 | #157, #158, #159, #160 | 12 |
| rxsoft | Payment Methods | 7 | [#161](https://github.com/ehealthwares/rxsoft/issues/161) | 6 | #162, #163, #164, #165, #166, #167 | 21 |
| rxsoft | Website Orders | 7 | [#168](https://github.com/ehealthwares/rxsoft/issues/168) | 4 | #169, #170, #171, #741 | 13 |
| rxsoft | Website Prescriptions | 7 | [#172](https://github.com/ehealthwares/rxsoft/issues/172) | 3 | #173, #174, #175 | 10 |
| rxsoft | Roles | 6 | [#176](https://github.com/ehealthwares/rxsoft/issues/176) | 7 | #177, #178, #179, #180, #181, #182, #183 | 24 |
| rxsoft | Role Requests | 6 | [#184](https://github.com/ehealthwares/rxsoft/issues/184) | 6 | #185, #186, #187, #188, #189, #190 | 21 |
| rxsoft | Dashboard | 5 | [#191](https://github.com/ehealthwares/rxsoft/issues/191) | 1 | #192 | 2 |
| rxsoft | Reports | 5 | [#193](https://github.com/ehealthwares/rxsoft/issues/193) | 1 | #194 | 2 |
| rxsoft | Balance Sheet | 5 | [#195](https://github.com/ehealthwares/rxsoft/issues/195) | 1 | #196 | 3 |
| rxsoft | Income Statement | 5 | [#197](https://github.com/ehealthwares/rxsoft/issues/197) | 1 | #198 | 3 |
| rxsoft | Trial Balance | 5 | [#199](https://github.com/ehealthwares/rxsoft/issues/199) | 1 | #200 | 3 |
| rxsoft | Sales Analytics | 5 | [#201](https://github.com/ehealthwares/rxsoft/issues/201) | 4 | #202, #203, #204, #205 | 12 |
| rxsoft | Purchases Analytics | 5 | [#206](https://github.com/ehealthwares/rxsoft/issues/206) | 4 | #207, #208, #209, #210 | 12 |
| rxsoft | Full Business Flow (end-to-end) | 8 | [#211](https://github.com/ehealthwares/rxsoft/issues/211) | 1 | #212 | 6 |
| rxsoft | Users | 2 | [#214](https://github.com/ehealthwares/rxsoft/issues/214) | 6 | #215, #216, #217, #218, #219, #220 | 21 |
| rxsoft | User Config | 2 | [#221](https://github.com/ehealthwares/rxsoft/issues/221) | 6 | #222, #223, #224, #225, #226, #227 | 21 |
| rxsoft | User Insights | 2 | [#228](https://github.com/ehealthwares/rxsoft/issues/228) | 4 | #229, #230, #231, #232 | 12 |
| rxsoft | Organizations | 2 | [#233](https://github.com/ehealthwares/rxsoft/issues/233) | 6 | #234, #235, #236, #237, #238, #239 | 21 |
| rxsoft | Organisation Config | 2 | [#240](https://github.com/ehealthwares/rxsoft/issues/240) | 4 | #241, #242, #243, #244 | 13 |
| rxsoft | Branches | 2 | [#245](https://github.com/ehealthwares/rxsoft/issues/245) | 5 | #246, #247, #248, #249, #250 | 16 |
| rxsoft | Customers | 2 | [#251](https://github.com/ehealthwares/rxsoft/issues/251) | 5 | #252, #253, #254, #255, #256 | 17 |
| rxsoft | Manufacturers | 2 | [#257](https://github.com/ehealthwares/rxsoft/issues/257) | 6 | #258, #259, #260, #261, #262, #263 | 21 |
| rxsoft | Pharmaceutics | 2 | [#264](https://github.com/ehealthwares/rxsoft/issues/264) | 3 | #265, #266, #267 | 10 |
| rxsoft | Drug Components | 2 | [#268](https://github.com/ehealthwares/rxsoft/issues/268) | 4 | #269, #270, #271, #272 | 12 |
| rxsoft | Audit Logs | 2 | [#273](https://github.com/ehealthwares/rxsoft/issues/273) | 4 | #274, #275, #276, #277 | 12 |
| rxsoft | GL Accounts | 2 | [#278](https://github.com/ehealthwares/rxsoft/issues/278) | 6 | #279, #280, #281, #282, #283, #284 | 21 |
| rxsoft | Journals | 2 | [#285](https://github.com/ehealthwares/rxsoft/issues/285) | 6 | #286, #287, #288, #289, #290, #291 | 21 |
| rxsoft | Journal Entries | 2 | [#292](https://github.com/ehealthwares/rxsoft/issues/292) | 6 | #293, #294, #295, #296, #297, #298 | 21 |
| rxsoft | Journal Entry Lines | 2 | [#299](https://github.com/ehealthwares/rxsoft/issues/299) | 4 | #300, #301, #302, #303 | 12 |
| rxsoft | Receivables | 2 | [#304](https://github.com/ehealthwares/rxsoft/issues/304) | 4 | #305, #306, #307, #308 | 12 |
| rxsoft | Insurance Providers | 2 | [#309](https://github.com/ehealthwares/rxsoft/issues/309) | 6 | #310, #311, #312, #313, #314, #315 | 21 |
| rxsoft | Settings (account/appearance/display/notifications) | 2 | [#316](https://github.com/ehealthwares/rxsoft/issues/316) | 1 | #317 | 4 |
| rxsoft | Reset Password | 2 | [#318](https://github.com/ehealthwares/rxsoft/issues/318) | 1 | #319 | 2 |
| ehealthwares | Articles | 22 | [#320](https://github.com/ehealthwares/rxsoft/issues/320) | 6 | #321, #322, #323, #324, #325, #326 | 21 |
| ehealthwares | Careers | 22 | [#327](https://github.com/ehealthwares/rxsoft/issues/327) | 6 | #328, #329, #330, #331, #332, #333 | 21 |
| ehealthwares | Categories | 22 | [#334](https://github.com/ehealthwares/rxsoft/issues/334) | 6 | #335, #336, #337, #338, #339, #340 | 21 |
| ehealthwares | Contact Submissions | 22 | [#341](https://github.com/ehealthwares/rxsoft/issues/341) | 6 | #342, #343, #344, #345, #346, #347 | 21 |
| ehealthwares | Hero Slides | 22 | [#348](https://github.com/ehealthwares/rxsoft/issues/348) | 6 | #349, #350, #351, #352, #353, #354 | 21 |
| ehealthwares | Investors | 22 | [#355](https://github.com/ehealthwares/rxsoft/issues/355) | 6 | #356, #357, #358, #359, #360, #361 | 21 |
| ehealthwares | Partners | 22 | [#362](https://github.com/ehealthwares/rxsoft/issues/362) | 6 | #363, #364, #365, #366, #367, #368 | 21 |
| ehealthwares | Products | 22 | [#369](https://github.com/ehealthwares/rxsoft/issues/369) | 6 | #370, #371, #372, #373, #374, #375 | 21 |
| ehealthwares | Sections | 22 | [#376](https://github.com/ehealthwares/rxsoft/issues/376) | 6 | #377, #378, #379, #380, #381, #382 | 21 |
| ehealthwares | Services | 22 | [#383](https://github.com/ehealthwares/rxsoft/issues/383) | 6 | #384, #385, #386, #387, #388, #389 | 21 |
| ehealthwares | Settings | 22 | [#390](https://github.com/ehealthwares/rxsoft/issues/390) | 6 | #391, #392, #393, #394, #395, #396 | 21 |
| ehealthwares | Team | 22 | [#397](https://github.com/ehealthwares/rxsoft/issues/397) | 6 | #398, #399, #400, #401, #402, #403 | 21 |
| ehealthwares | Testimonials | 22 | [#404](https://github.com/ehealthwares/rxsoft/issues/404) | 6 | #405, #406, #407, #408, #409, #410 | 21 |
| emr | Patients | 10 | [#411](https://github.com/ehealthwares/rxsoft/issues/411) | 7 | #412, #413, #414, #415, #416, #417, #418 | 24 |
| emr | Staff | 10 | [#419](https://github.com/ehealthwares/rxsoft/issues/419) | 6 | #420, #421, #422, #423, #424, #425 | 21 |
| emr | Appointments | 10 | [#426](https://github.com/ehealthwares/rxsoft/issues/426) | 7 | #427, #428, #429, #430, #431, #432, #433 | 25 |
| emr | Visits | 10 | [#434](https://github.com/ehealthwares/rxsoft/issues/434) | 6 | #435, #436, #437, #438, #439, #440 | 21 |
| emr | Encounters | 10 | [#441](https://github.com/ehealthwares/rxsoft/issues/441) | 7 | #442, #443, #444, #445, #446, #447, #448 | 23 |
| emr | Forms & Documentation | 10 | [#449](https://github.com/ehealthwares/rxsoft/issues/449) | 8 | #450, #451, #452, #453, #454, #455, #456, #457 | 27 |
| emr | Clinical Requests | 10 | [#458](https://github.com/ehealthwares/rxsoft/issues/458) | 7 | #459, #460, #461, #462, #463, #464, #465 | 25 |
| emr | Wards | 10 | [#466](https://github.com/ehealthwares/rxsoft/issues/466) | 6 | #467, #468, #469, #470, #471, #472 | 21 |
| emr | Beds | 10 | [#473](https://github.com/ehealthwares/rxsoft/issues/473) | 6 | #474, #475, #476, #477, #478, #479 | 21 |
| emr | Admissions | 10 | [#480](https://github.com/ehealthwares/rxsoft/issues/480) | 6 | #481, #482, #483, #484, #486, #487 | 21 |
| emr | Discharges | 10 | [#488](https://github.com/ehealthwares/rxsoft/issues/488) | 6 | #489, #490, #491, #492, #493, #494 | 21 |
| emr | Departments | 10 | [#495](https://github.com/ehealthwares/rxsoft/issues/495) | 6 | #496, #497, #498, #499, #500, #501 | 21 |
| emr | Medications | 10 | [#502](https://github.com/ehealthwares/rxsoft/issues/502) | 6 | #503, #504, #505, #506, #507, #508 | 21 |
| emr | Referrals | 10 | [#509](https://github.com/ehealthwares/rxsoft/issues/509) | 6 | #510, #511, #512, #513, #514, #515 | 21 |
| emr | Tags | 10 | [#516](https://github.com/ehealthwares/rxsoft/issues/516) | 6 | #517, #518, #519, #520, #521, #522 | 21 |
| emr | Dashboard | 10 | [#523](https://github.com/ehealthwares/rxsoft/issues/523) | 1 | #524 | 2 |
| lis | Test Definitions | 15 | [#525](https://github.com/ehealthwares/rxsoft/issues/525) | 6 | #526, #527, #528, #529, #530, #531 | 21 |
| lis | Reference Ranges | 15 | [#532](https://github.com/ehealthwares/rxsoft/issues/532) | 6 | #533, #534, #535, #536, #537, #538 | 21 |
| lis | LOINC | 15 | [#539](https://github.com/ehealthwares/rxsoft/issues/539) | 6 | #540, #541, #542, #543, #544, #545 | 21 |
| lis | Patients | 15 | [#546](https://github.com/ehealthwares/rxsoft/issues/546) | 6 | #547, #548, #549, #550, #551, #552 | 21 |
| lis | Samples | 15 | [#553](https://github.com/ehealthwares/rxsoft/issues/553) | 6 | #554, #555, #556, #557, #558, #559 | 21 |
| lis | Results | 15 | [#560](https://github.com/ehealthwares/rxsoft/issues/560) | 6 | #561, #562, #563, #564, #565, #566 | 21 |
| lis | Result Signatures | 15 | [#567](https://github.com/ehealthwares/rxsoft/issues/567) | 6 | #568, #569, #570, #571, #572, #573 | 21 |
| lis | Orders | 15 | [#574](https://github.com/ehealthwares/rxsoft/issues/574) | 6 | #575, #576, #577, #578, #579, #580 | 21 |
| lis | Panels | 15 | [#581](https://github.com/ehealthwares/rxsoft/issues/581) | 6 | #582, #583, #584, #585, #586, #587 | 21 |
| lis | Programs | 15 | [#588](https://github.com/ehealthwares/rxsoft/issues/588) | 6 | #589, #590, #591, #592, #593, #594 | 21 |
| lis | Location Types | 15 | [#595](https://github.com/ehealthwares/rxsoft/issues/595) | 6 | #596, #597, #598, #599, #600, #601 | 21 |
| lis | Locations | 15 | [#602](https://github.com/ehealthwares/rxsoft/issues/602) | 6 | #603, #604, #605, #606, #607, #608 | 21 |
| lis | Attribute Definitions | 15 | [#609](https://github.com/ehealthwares/rxsoft/issues/609) | 6 | #610, #611, #612, #613, #614, #615 | 21 |
| lis | Sample Types | 15 | [#616](https://github.com/ehealthwares/rxsoft/issues/616) | 6 | #617, #618, #619, #620, #621, #622 | 21 |
| lis | Priorities | 15 | [#623](https://github.com/ehealthwares/rxsoft/issues/623) | 6 | #624, #625, #626, #627, #628, #629 | 21 |
| lis | Test Categories | 15 | [#630](https://github.com/ehealthwares/rxsoft/issues/630) | 6 | #631, #632, #633, #634, #635, #636 | 21 |
| lis | Test Sections | 15 | [#637](https://github.com/ehealthwares/rxsoft/issues/637) | 6 | #638, #639, #640, #641, #642, #643 | 21 |
| lis | Methods | 15 | [#644](https://github.com/ehealthwares/rxsoft/issues/644) | 6 | #645, #646, #647, #648, #649, #650 | 21 |
| lis | UOMs | 15 | [#651](https://github.com/ehealthwares/rxsoft/issues/651) | 6 | #652, #653, #654, #655, #656, #657 | 21 |
| lis | Statuses | 15 | [#658](https://github.com/ehealthwares/rxsoft/issues/658) | 6 | #659, #660, #661, #662, #663, #664 | 21 |
| lis | Status History | 15 | [#665](https://github.com/ehealthwares/rxsoft/issues/665) | 6 | #666, #667, #668, #669, #670, #671 | 21 |
| lis | QA Checklist Items | 15 | [#672](https://github.com/ehealthwares/rxsoft/issues/672) | 6 | #673, #674, #675, #676, #677, #678 | 21 |
| lis | QC Lots | 15 | [#679](https://github.com/ehealthwares/rxsoft/issues/679) | 6 | #680, #681, #682, #683, #684, #685 | 21 |
| lis | QC Results | 15 | [#686](https://github.com/ehealthwares/rxsoft/issues/686) | 6 | #687, #688, #689, #690, #691, #692 | 21 |
| lis | QC Alerts | 15 | [#693](https://github.com/ehealthwares/rxsoft/issues/693) | 6 | #694, #695, #696, #697, #698, #699 | 21 |
| lis | EQA Programs | 15 | [#700](https://github.com/ehealthwares/rxsoft/issues/700) | 6 | #701, #702, #703, #704, #705, #706 | 21 |
| lis | EQA Enrollments | 15 | [#707](https://github.com/ehealthwares/rxsoft/issues/707) | 6 | #708, #709, #710, #711, #712, #713 | 21 |
| lis | EQA Results | 15 | [#714](https://github.com/ehealthwares/rxsoft/issues/714) | 6 | #715, #716, #717, #718, #719, #720 | 21 |
| lis | Rejection Reasons | 15 | [#721](https://github.com/ehealthwares/rxsoft/issues/721) | 6 | #722, #723, #724, #725, #726, #727 | 21 |
| lis | Orders — 5-Step Workflow | 16 | [#728](https://github.com/ehealthwares/rxsoft/issues/728) | 1 | #729 | 5 |
| lis | Orders Dashboard | 16 | [#730](https://github.com/ehealthwares/rxsoft/issues/730) | 1 | #731 | 1 |
| lis | Validation Dashboard | 16 | [#732](https://github.com/ehealthwares/rxsoft/issues/732) | 1 | #733 | 1 |
| lis | Order Report Builder | 16 | [#734](https://github.com/ehealthwares/rxsoft/issues/734) | 1 | #735 | 3 |
| lis | Reference Range Coverage | 16 | [#736](https://github.com/ehealthwares/rxsoft/issues/736) | 1 | #737 | 1 |
| lis | LIS Hub Navigation | 16 | [#738](https://github.com/ehealthwares/rxsoft/issues/738) | 1 | #739 | 2 |

## Totals

- Entities (tasks): **116** (created: 116)
- Use cases (sub-issues): **593** (created: 593)
- Test cases (checklists): **2039**
- Entities with missing pieces: **0**
