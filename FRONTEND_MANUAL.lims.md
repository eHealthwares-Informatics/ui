# FRONTEND MANUAL — LIMS (Laboratory Information System)

**Frontend routes:** `/lis/*`
**Backend:** `rxsoft-lis-backend` (port 8091)

---

## 1. What You Can Do

The LIMS module manages the full laboratory workflow: test catalog configuration, sample handling, order processing, result entry, quality control, andExternal Quality Assessment (EQA) programs. It provides a resource-card dashboard and dedicated CRUD pages for 30+ laboratory entities.

---

## 2. Navigation

```
Sidebar → LIS
  ├── Dashboard (Metrics + Drill-down)
  ├── Test Management
  │   ├── Test Definitions
  │   ├── Test Categories
  │   ├── Test Sections
  │   ├── Panels
  │   ├── LOINC Codes
  │   └── Methods
  ├── Sample Management
  │   ├── Sample Types
  │   ├── Samples
  │   └── Locations / Location Types
  ├── Orders
  │   ├── Orders List
  │   ├── Order Workflow (5-step wizard)
  │   └── Order Report (result entry + print)
  ├── Results
  │   ├── Results List
  │   └── Result Signatures
  ├── Reference Data
  │   ├── UOMs (Units of Measure)
  │   ├── Reference Ranges
  │   ├── Priorities
  │   ├── Rejection Reasons
  │   └── Attribute Definitions
  ├── Quality Control
  │   ├── QC Lots
  │   ├── QC Results
  │   ├── QC Alerts
  │   └── QA Checklist Items
  └── External Quality Assessment
      ├── EQA Programs
      ├── EQA Enrollments
      └── EQA Results
```

---

## 3. LIS Dashboard

**Route:** `/lis/orders/dashboard`

The LIS dashboard is a **metrics-driven operational view** that auto-refreshes every 60 seconds.

### KPI Metric Cards

Each card is clickable — click to see a drill-down modal with the underlying orders.

| Card | Icon | Color | Description |
|---|---|---|
| **Total Orders** | Clipboard | Blue | All orders (non-clickable summary) |
| **In Progress** | Clock | Orange | Orders awaiting result entry |
| **Ready for Validation** | Microscope | Yellow | Results entered, awaiting review |
| **Completed Today** | Checkmark | Green | Orders finished today |
| **Partially Completed** | Ban | Grape | Some tests still pending |
| **Entered by You** | User+ | Cyan | Orders you created today |
| **Rejected Today** | X-Circle | Red | Samples rejected today |
| **Unprinted Results** | Printer | Teal | Validated results not yet printed |
| **Electronic Orders** | Inbox | Blue | Samples received today |
| **Avg TAT** | TrendingUp | Teal | Average turnaround time (hours) |
| **Delayed Turnaround** | AlertTriangle | Red | Orders exceeding TAT threshold |

### Drill-Down Modal

Click any metric card to open a modal with:
- **Paginated table** of the underlying orders
- **Columns** vary by metric type (e.g., In Progress shows Order #, Patient, Status, Received date)
- **Pagination** controls at the bottom
- **Click a row** to navigate to the order report

### Daily Trend Chart

Below the metric cards, a **7-day area chart** shows:
- **Received** orders per day (blue area)
- **Completed** orders per day (green area)
- Hover for exact numbers

### TAT Sub-Metrics

The Average TAT card breaks down into:
- Reception → Validation time
- Reception → Result entry time
- Result entry → Validation time

---

## 4. Test Management

### Test Definitions

**Route:** `/lis/test-definitions`

The core test catalog. Each test definition describes a laboratory test that can be ordered.

**List columns:** Code, Name, Result Type, Active

**Create/Edit form (tabbed):**

#### Tab 1: General — Basic Information
| Field | Type | Description |
|---|---|---|
| Code | text | Unique test code (e.g., "CBC", "BMP") |
| LOINC | async-select | Link to LOINC code (searchable from `/lis/loinc`) |
| Name | text (required) | Full test name |
| Methodology | text | Testing methodology |
| Description | text | Detailed description |
| Category | async-select | Test category |
| Result Type | select | NUMERIC, TEXT, DICTIONARY, BOOLEAN, DATE, RICH_TEXT, ATTACHMENT, TABLE, CALCULATED |
| Unit | async-select | Unit of measure |

#### Tab 2: Workflow & Assignment
| Field | Type | Description |
|---|---|---|
| Sample Types | multi-async-select | Accepted sample types |
| Programs | multi-async-select | Associated programs |
| Turnaround Minutes | number | Expected turnaround time |
| Test Duration Minutes | number | Estimated test duration |
| Reportable | switch | Whether results are reportable |

### Test Categories

**Route:** `/lis/test-categories`

**Columns:** Name, Code, Description
**Create:** Name, Code, Description, Sort Order

### Test Sections

**Route:** `/lis/test-sections`

Laboratory sections/departments that perform tests.

**Columns:** Name, Code, Department, Manager
**Create:** Name, Code, Department, Manager

### Panels

**Route:** `/lis/panels`

Groups of tests that are ordered together (e.g., "Complete Blood Count" panel includes WBC, RBC, HGB, etc.).

**Columns:** Name, Code, Tests (count), Active
**Create:** Name, Code, Description, Select tests (multi-select from test definitions)

### LOINC Codes

**Route:** `/lis/loinc`

LOINC (Logical Observation Identifiers Names and Codes) reference database.

**Columns:** Code, Name, Class, Status
**Search:** By LOINC code or name

### Methods

**Route:** `/lis/methods`

Testing methodologies and instruments.

**Columns:** Name, Code, Description, Manufacturer
**Create:** Name, Code, Description, Instrument details

---

## 5. Sample Management

### Sample Types

**Route:** `/lis/sample-types`

Types of specimens that can be collected (e.g., Blood, Urine, CSF, Tissue).

**Columns:** Name, Code, Description, Active
**Create:** Name, Code, Description, Handling instructions

### Samples

**Route:** `/lis/samples`

Individual specimen records.

**Columns:** Sample ID, Patient, Sample Type, Collection Date, Status, Location

**Filters:** Sample type, status, date range

### Locations

**Route:** `/lis/locations`

Physical locations within the laboratory.

**Columns:** Name, Code, Type, Building, Floor
**Create:** Name, Code, Location Type (select), Building, Floor

### Location Types

**Route:** `/lis/location-types`

Categories of laboratory locations.

**Columns:** Name, Code, Description
**Create:** Name, Code

---

## 6. Orders — Full Workflow

### 6.1 Orders List

**Route:** `/lis/orders`

Standard list view with search and filters.

**Columns:**
| Column | Description |
|---|---|
| Order # | Unique order number |
| Patient | Patient name |
| MRN | Medical record number |
| Status | Current order status |
| Requested | Requested date |

**Create/Edit form (tabbed):**

**Tab 1: Patient Information**
| Field | Type | Required |
|---|---|---|
| MRN | text | Yes |
| Patient Name | text | Yes |
| Gender | select (MALE/FEMALE/OTHER/UNKNOWN) | No |
| Date of Birth | date | No |
| Age | number | No |
| Internal Reference | text | No |
| External Reference | text | No |

**Tab 2: Order Details**
| Field | Type | Required |
|---|---|---|
| Order Number | text | No (auto) |
| Status | text | No |
| Priority | async-select (`/lis/priorities`) | No |
| Requested Date | date | No |
| Tests | multi-async-select (`/lis/test-definitions`) | No |
| Notes | textarea | No |

Clicking a row navigates to the **Order Report** page.

---

### 6.2 Order Workflow (5-Step Wizard)

**Route:** `/lis/orders/workflow`

The workflow is a guided 5-step process for creating and processing lab orders. It uses a shared state context (React reducer) that persists across all steps.

#### Workflow Layout

The layout includes:
1. **Barcode Scanner Bar** — Top bar for scanning order barcodes or searching by order number
2. **Stepper** — Visual step indicator showing progress (Enter → Collect → Label → QA → Order)
3. **Context Card** — Shows order number, patient name, MRN, and progress bar (e.g., "3/5")
4. **Step Content** — The current step's form
5. **Navigation Buttons** — Back, Save, Save & Next

#### Step 1: Enter (Patient & Tests)

**Route:** `/lis/orders/workflow/enter`

Three sections:

**Patient Search Section:**
- Search bar with debounced API lookup (`/lis/patients`)
- Results table showing: Patient ID, Name, Gender, DOB
- Click a row to select the patient
- **"Register New Patient"** button opens a modal with:
  - First Name, Last Name (required)
  - Gender (select)
  - Date of Birth (date picker)
  - Phone, Email
- Selected patient appears as a card with name, MRN, gender, DOB, age

**Sample Test Selection Section:**
- Search bar to filter tests by name or code
- **Panels** displayed as cards — click to toggle all tests in the panel on/off
- **Individual tests** displayed as checkboxes with code and name
- Selected tests show with a checkmark badge
- Tests are sorted: selected tests first, then alphabetical
- **Selected count** shown in the header

**Order Details Section:**
| Field | Type |
|---|---|
| Priority | async-select (from `/lis/priorities`) |
| Requested Date | date picker |
| Requester Name | text (referring physician) |
| Requester Phone | text |
| Diagnosis | text |
| Clinical Notes | textarea |
| Notes | textarea |

**Gate:** Must have patient name, MRN, and at least one test selected to proceed.

**Save & Next** → Creates/updates the order and navigates to Step 2.

---

#### Step 2: Collect (Sample Collection)

**Route:** `/lis/orders/workflow/collect`

Two sections:

**Samples Collection Section:**
- **"Add Sample"** button creates a new sample card
- Each sample card shows:
  | Field | Type | Description |
  |---|---|---|
  | Barcode | text (auto-generated: `S-{timestamp}`) | Unique sample identifier |
  | Sample Type | async-select (`/lis/sample-types`) | Blood, Urine, CSF, etc. |
  | Collector | text | Who collected the sample |
  | Collection Date | date picker | When it was collected |
  | Collection Method | text | How it was collected |
  | Collection Conditions | text | Special conditions |
  | Quantity | number | Amount collected |
  | Notes | text | Additional notes |
- **Delete button** (trash icon) removes a sample
- When sample type changes, quantity auto-fills from the type's default
- Collection method auto-fills from the first test's method

**Test-to-Sample Assignment Section:**
- Table showing each ordered test and a dropdown to assign it to a sample
- **Assignment columns:** Test name → Assigned Sample (dropdown of sample numbers)
- **Unassigned tests** shown below with a "Sample not assigned" badge
- Click a sample badge to unassign
- **Gate:** All tests must be assigned to proceed

**Save & Next** → Saves samples and assignments, navigates to Step 3.

---

#### Step 3: Label (Labels & Storage)

**Route:** `/lis/orders/workflow/label`

Two sections:

**Print Labels Section:**
- Table of all labels to print:
  | Label | Content |
  |---|---|
  | Order Label | Order number |
  | Sample #1 Label | Barcode + sample type name |
  | Sample #2 Label | Barcode + sample type name |
  | ... | ... |
- **Quantity input** per label (number of copies)
- **Print button** per label — shows notification, marks as PRINTED
- **"Print All"** button — prints all unprinted labels
- **Status badge:** Printed (green) or Not Printed (gray)
- **Printed date** shown after printing

**Storage Section:**
- For each sample, assign a storage location:
  | Field | Type |
  |---|---|
  | Storage Location | autocomplete (from `/lis/locations` where `storageAssignment=true`) |
  | Storage Notes | textarea |
- Locations show name and reference code
- **Status badge:** Stored (green) or Not Stored (yellow)

**Save & Next** → Saves print status and storage assignments, navigates to Step 4.

---

#### Step 4: QA (Review & Approve)

**Route:** `/lis/orders/workflow/qa`

Two sections:

**QA Checklist Section:**
- Loads checklist items from `/lis/qa-checklist-items`
- Each item is a **checkbox** with name and category
- **Progress badge:** e.g., "5/8" (completed/total)
- Color: Green when all checked, Yellow when incomplete
- Error alert if checklist fails to load

**Order Summary Section:**
- **Accordion** with three panels:

  **Patient Information:**
  - Name, MRN, Gender, DOB, Age

  **Ordered Tests:**
  - Table: Test name, Assigned sample badge (violet) or "Not assigned" (gray)

  **Samples:**
  - For each sample: barcode, type, collector, date, storage location, print status badges

**Save & Next** → Saves QA checks, navigates to Step 5.

---

#### Step 5: Order (Final Review)

**Route:** `/lis/orders/workflow/order`

Shows the full **Order Report** (same as the report page, embedded) with:
- Patient details
- Test results table
- Reference ranges
- Print / PDF export
- Share options (email, SMS, WhatsApp)

**Save & Finish** → Finalizes the order and returns to the orders list.

---

### 6.3 Order Report (Result Entry & Print)

**Route:** `/lis/orders/:orderId/report`

The report page is the primary interface for entering results and generating printable reports.

#### Header
- **Order number** with badge
- **Patient name** and **MRN**
- **Status** badge
- **Priority** badge
- **Previous/Next** navigation arrows (cycles through orders from the list)

#### Result Entry Table
For each ordered test:
| Column | Description |
|---|---|
| Test Name | Full test name |
| Value | Text input for the result value |
| Unit | async-select from UOMs |
| Reference Range | Dropdown of applicable ranges (filtered by gender/age) |
| Abnormal | Switch toggle |
| Notes | Text input |
| Status | Badge: Pending, Entered, Validated |

#### Reference Range Auto-Selection
When a result value is entered, the system automatically selects the correct reference range based on:
- Patient gender
- Patient age
- Test definition

Ranges are highlighted: normal (green), borderline (yellow), critical (red).

#### Actions Bar
| Action | Description |
|---|---|
| **Save** | Save current result values |
| **Validate** | Mark results as validated (requires signature) |
| **Print** | Generate PDF report and open print dialog |
| **Email** | Send report via email |
| **SMS** | Send report via SMS |
| **WhatsApp** | Send report via WhatsApp |

#### PDF Report Generation
- Generates a formatted HTML report from `report-print.ts`
- Includes: hospital header, patient details, test results with reference ranges, signature line
- Opens in a new tab with print dialog

#### Previous/Next Navigation
- Arrow buttons in the header cycle through orders
- Order IDs are stored in localStorage from the orders list

---

### 6.4 Results List

**Route:** `/lis/results`

**Columns:** Order Item, Value, Unit, Entered Date, Validated Date, Acknowledged

**Create/Edit form (tabbed):**

**Tab: Result Entry**
| Field | Type | Description |
|---|---|---|
| Order Item ID | text (disabled) | Linked order item |
| Value | text (required) | The result value |
| Unit | async-select (`/lis/uoms`) | Unit of measure |
| Abnormal | switch | Flag if abnormal |
| Notes | text | Additional notes |
| Entered By | async-select (`/lis/users`) | Who entered the result |
| Entered Date | text | When it was entered |
| Validated By | async-select (`/lis/users`) | Who validated |
| Validated Date | text | When it was validated |

---

### 6.5 Result Signatures

**Route:** `/lis/result-signatures`

Digital signatures for result verification.

**Columns:** Result, Signer, Signature Date, Status
**Create:** Result (select), Notes

---

### 6.6 Statuses & Status History

**Route:** `/lis/statuses` and `/lis/status-history`

Configurable order/result statuses and full audit trail of all transitions.

**Statuses columns:** Name, Code, Category, Sort Order
**Status History columns:** Entity, From Status, To Status, Changed By, Changed At

---

## 7. Reference Data

### UOMs (Units of Measure)

**Route:** `/lis/uoms`

**Columns:** Name, Code, Symbol, Category
**Create:** Name, Code, Symbol, Category

### Reference Ranges

**Route:** `/lis/reference-ranges`

Normal value ranges for test results, typically varying by age, gender, and population.

**Columns:** Test, Gender, Age Range (min/max), Low, High, Units, Population

**Create:** Test (select), Gender, Age range, Low value, High value, Units, Population

### Priorities

**Route:** `/lis/priorities`

Order priority levels.

**Columns:** Name, Code, Turnaround (minutes), Color
**Create:** Name, Code, Turnaround, Color

### Rejection Reasons

**Route:** `/lis/rejection-reasons`

Standardized reasons for rejecting samples or results.

**Columns:** Code, Description, Category
**Create:** Code, Description, Category

### Attribute Definitions

**Route:** `/lis/attribute-definitions`

Additional attributes that can be attached to orders or samples.

**Columns:** Name, Code, Type, Required, Applicable To
**Create:** Name, Code, Data Type, Required, Applies To

---

## 8. Quality Control

### QC Lots

**Route:** `/lis/qc-lots`

Quality control material lots with expiry tracking.

**Columns:** Lot Number, Material, Level, Expiry Date, Status
**Create:** Lot Number, Material, Level, Expiry Date, Manufacturer

### QC Results

**Route:** `/lis/qc-results`

Recorded QC test results for each lot.

**Columns:** Lot, Test, Result, Unit, Target, Range, Status, Date
**Create:** Lot (select), Test (select), Result value

### QC Alerts

**Route:** `/lis/qc-alerts`

Automated alerts when QC results fall outside acceptable ranges.

**Columns:** Lot, Test, Alert Type, Message, Date, Acknowledged
**Actions:** Acknowledge alert

### QA Checklist Items

**Route:** `/lis/qa-checklist-items`

Quality assurance checklist items for laboratory audits.

**Columns:** Item, Category, Frequency, Status, Last Checked
**Create:** Item description, Category, Frequency, Responsible role

---

## 9. External Quality Assessment (EQA)

### EQA Programs

**Route:** `/lis/eqa-programs`

External proficiency testing programs.

**Columns:** Name, Provider, Frequency, Status
**Create:** Name, Provider, Description, Frequency, Contact

### EQA Enrollments

**Route:** `/lis/eqa-enrollments`

Laboratory enrollments in EQA programs.

**Columns:** Program, Laboratory, Enrollment Date, Status
**Create:** Program (select), Enrollment date, Contact person

### EQA Results

**Route:** `/lis/eqa-results`

Results submitted to external quality assessment programs.

**Columns:** Program, Round, Test, Submitted Value, Acceptable Range, Score
**Create:** Program, Round, Test, Submitted value

---

## 10. Common UI Patterns

### Resource Pages

Each LIS resource page follows a consistent pattern:

1. **Header** — Resource title and description
2. **Search bar** — Filter the list
3. **Add button** — Opens create modal
4. **Data table** — Sortable columns with pagination
5. **Row actions** — Edit, delete (via ⋮ menu or row click)

### Async-Select Fields

Many fields use async-select, which:
- Searches the API as you type (minimum characters configurable)
- Shows a dropdown of matching results
- Loads options from the specified endpoint (e.g., `/lis/loinc`, `/lis/uoms`)

### Multi-Async-Select

For fields that accept multiple values (e.g., sample types, programs):
- Click to open the dropdown
- Select multiple items (they appear as chips)
- Click × on a chip to remove it

---

## 11. Tips & Shortcuts

| Feature | How To |
|---|---|
| **Quick search** | Type in the search bar on any list page |
| **Barcode scan** | Use the barcode scanner bar at the top of the workflow to load an order by scanning or typing |
| **LOINC lookup** | Use the async-select in test definitions to search LOINC codes |
| **Panel selection** | Click a panel card in Step 1 to toggle all its tests on/off at once |
| **Auto-fill collection method** | Collection method auto-fills from the first test's method definition |
| **Auto-fill sample quantity** | Quantity defaults to the sample type's `defaultQuantity` |
| **Print all labels** | Click "Print All" in Step 3 to print all labels at once |
| **Navigate between orders** | Use Previous/Next arrows in the report header to cycle through orders |
| **Reference range auto-select** | Enter result value → system auto-picks the correct range by gender/age |
| **Click metric cards** | Dashboard metric cards are clickable for drill-down into the underlying orders |
| **Panel management** | Create panels to group related tests for batch ordering |
| **QC monitoring** | Check QC Alerts regularly for out-of-range results |
| **Reference ranges** | Set up by test + gender + age for accurate result interpretation |
| **EQA tracking** | Monitor EQA scores for accreditation compliance |
| **Workflow step click** | Click any completed or current step in the stepper to jump back to it |

---

## 12. Troubleshooting

| Issue | Solution |
|---|---|
| LOINC search returns nothing | Ensure the interop service has LOINC data loaded |
| Can't create order | Check your role has `lis.orders.write` permission |
| QC alerts not appearing | QC results must be entered first; check lot expiry dates |
| Sample not showing | Verify sample type is active and assigned to the correct test |
| EQA results missing | Check enrollment is active for the current program round |
| Workflow "Save & Next" disabled | Check that all required fields are filled (Step 1: patient + tests; Step 2: samples + all tests assigned) |
| Barcode scanner not finding order | Ensure the order exists; try searching by patient name or MRN instead |
| Reference range not auto-selecting | Check that reference ranges exist for the test with matching gender/age |
| Print labels not working | Labels are marked as printed in the UI; actual printer integration requires backend config |
| Dashboard metrics not loading | Check `/lis/dashboard/metrics` endpoint is accessible; metrics auto-refresh every 60s |
| Drill-down modal empty | The metric endpoint may not have data for that category; try a different date range |
| TAT showing as 0h | No completed orders in the period; TAT requires reception + validation timestamps |
| Previous/Next arrows grayed out | Order IDs are loaded from localStorage; navigate from the orders list first |

---

## 13. Related Documentation

- [MANUAL.lims.md](./MANUAL.lims.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
