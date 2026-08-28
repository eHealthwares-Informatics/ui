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
  ├── Dashboard (Resource Cards)
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
  ├── Orders & Results
  │   ├── Orders
  │   ├── Results
  │   ├── Result Signatures
  │   └── Statuses / Status History
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

**Route:** `/lis`

The dashboard presents a **card grid** of all LIS resources. Each card shows:
- **Resource title** (e.g., "Test Definitions", "Samples", "Orders")
- **Description** — What this resource manages
- **Manage button** — Navigates to the dedicated resource page

Click any card to enter that resource's full CRUD interface.

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

## 6. Orders & Results

### Orders

**Route:** `/lis/orders`

Laboratory orders with full workflow tracking.

**Sub-views:**
- **Dashboard** — Order summary and statistics
- **Workflow** — Kanban-style view of orders by status
- **Report** — Order reporting

**Columns:** Order #, Patient, Tests, Priority, Status, Ordered Date, Completed Date

**Filters:** Status, priority, date range, provider

**Statuses:** REQUESTED → IN_PROGRESS → COMPLETED | CANCELLED | REJECTED

### Results

**Route:** `/lis/results`

Individual test results linked to orders.

**Columns:** Order #, Test, Result Value, Unit, Reference Range, Status, Reviewed

**Filters:** Test, status, date range

### Result Signatures

**Route:** `/lis/result-signatures`

Digital signatures for result verification and approval.

**Columns:** Result, Signer, Signature Date, Status
**Create:** Result (select), Notes

### Statuses

**Route:** `/lis/statuses`

Configurable order and result statuses.

**Columns:** Name, Code, Category, Sort Order
**Create:** Name, Code, Category, Color, Sort Order

### Status History

**Route:** `/lis/status-history`

Audit trail of all status changes for orders and results.

**Columns:** Entity, From Status, To Status, Changed By, Changed At

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
| **LOINC lookup** | Use the async-select in test definitions to search LOINC codes |
| **Panel management** | Create panels to group related tests for batch ordering |
| **QC monitoring** | Check QC Alerts regularly for out-of-range results |
| **Reference ranges** | Set up by test + gender + age for accurate result interpretation |
| **EQA tracking** | Monitor EQA scores for accreditation compliance |

---

## 12. Troubleshooting

| Issue | Solution |
|---|---|
| LOINC search returns nothing | Ensure the interop service has LOINC data loaded |
| Can't create order | Check your role has `lis.orders.write` permission |
| QC alerts not appearing | QC results must be entered first; check lot expiry dates |
| Sample not showing | Verify sample type is active and assigned to the correct test |
| EQA results missing | Check enrollment is active for the current program round |

---

## 13. Related Documentation

- [MANUAL.lims.md](./MANUAL.lims.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
