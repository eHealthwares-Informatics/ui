# FRONTEND MANUAL — EMR (Electronic Medical Records)

**Frontend routes:** `/emr/*`
**Backend:** `emr` (port 8094)

---

## 1. What You Can Do

The EMR module provides the complete clinical workflow interface: patient registration, appointment scheduling, visit management, encounter recording with live timers, dynamic form documentation (with a visual form builder), clinical order management with lifecycle tracking, and a clinical dashboard.

---

## 2. Navigation

```
Sidebar → EMR
  ├── Dashboard
  ├── Patients
  ├── Appointments
  ├── Visits
  ├── Encounters
  ├── Staff
  ├── Departments
  ├── Forms (Form Definitions)
  └── Requests (Clinical Orders)
```

---

## 3. EMR Dashboard

**Route:** `/emr`

The dashboard greets you with a time-appropriate message and shows today's clinical overview:

### Metrics Cards
- **Total Appointments** — Count for today
- **Checked In** — Patients who have arrived
- **In Progress** — Currently active appointments
- **Completed** — Finished appointments
- **Provider Load** — Visual bar showing each provider's appointment count

### Upcoming Appointments
A list of today's upcoming appointments with:
- Patient name (clickable link to profile)
- Time
- Provider
- Type and priority
- Status badge (color-coded)

### Appointment Rows
Each row shows the appointment status with color-coded badges:
- 🟡 **Scheduled** — Yellow badge
- 🔵 **Checked In** — Blue badge
- 🟢 **In Progress** — Green badge
- ⚪ **Completed** — Gray badge
- 🔴 **Cancelled** — Red badge
- 🟠 **No Show** — Orange badge

---

## 4. Patient Management

### Patients List

**Route:** `/emr/patients`

A searchable, paginated list of all registered patients.

**Features:**
- **Search** — Instant filter by name, MRN, or phone number
- **Columns:** Name, MRN, Gender, DOB, Phone, Blood Group, Status
- **Pagination** — Navigate through pages

### Registering a Patient

1. Click **Add Patient** button
2. Fill in the form:
   - **First Name** (required)
   - **Last Name** (required)
   - **Gender** (select: Male, Female, Other)
   - **Date of Birth** (date picker)
   - **Phone** (with country code)
   - **Email**
   - **Address** (line 1, line 2, city, state, country)
   - **Blood Group** (select: A+, A-, B+, B-, AB+, AB-, O+, O-)
   - **Genotype** (select: AA, AS, AC, SS, SC, CC)
   - **Next of Kin** (name, phone, relationship)
   - **MRN** (auto-generated if left blank)
3. Click **Create**

### Patient Profile

**Route:** `/emr/patients/:patientId`

The patient profile is a tabbed view with full patient information:

#### Demographics Card
- Patient avatar (initials)
- Full name, MRN, gender, age
- Phone, email, address
- Blood group, genotype
- **Edit button** → Opens the edit modal with dirty-state guard

#### Tabs

| Tab | Content |
|---|---|
| **Appointments** | List of all appointments for this patient. Click row → appointment detail. **Schedule Appointment** button opens the appointment form pre-filled with this patient. |
| **Visits** | All visits. Click row → visit detail. |
| **Encounters** | All encounters. Click row → encounter detail. |
| **Requests** | Clinical orders. Click row → request detail with full timeline. |
| **Documentation** | Form submissions. Click row → view submission. **New Documentation** button opens the documentation modal pre-filled. |

#### Actions from Profile
- **Schedule Appointment** — Opens appointment form with patient pre-selected
- **New Documentation** — Opens documentation modal with patient pre-selected
- **Edit Demographics** — Opens edit modal

### Editing Patient Demographics

1. From the patient profile, click **Edit** (pencil icon)
2. The edit modal opens with all fields pre-filled
3. Modify only the changed fields
4. If you try to navigate away with unsaved changes, a **dirty-state guard** prompts you to confirm
5. Click **Save** — changes are logged in the audit trail with a per-field diff

### Finding a Patient by MRN

Use the sidebar "Find patient by MRN" search or navigate directly to `/emr/patients/by-mrn/:mrn`.

---

## 5. Staff Management

### Staff List

**Route:** `/emr/staff`

Searchable list of all clinical and administrative staff.

**Columns:** Staff Number, Name, Role, Department, Email, Phone, Active

**Filters:** Role type, Department, Active status

### Registering Staff

1. Click **Add Staff**
2. Fill in:
   - **Staff Number** (auto-generated)
   - **First Name** / **Last Name** (required)
   - **Email** / **Phone**
   - **Hire Date**
   - **Role Type** (select: Doctor, Nurse, Technician, Therapist, Admin, Support)
   - **Category**
   - **Department** (select from departments)
   - **Identity User ID** (optional — link to identity service user)
3. Click **Create**

### Provider Picker

When scheduling appointments, creating encounters, or ordering requests, the provider field is a **searchable staff picker** that:
- Searches by name or staff number
- Only shows active staff
- Stores both `providerId` and `providerName`

---

## 6. Department Management

### Departments List

**Route:** `/emr/departments`

**Columns:** Name, Code, Description, Head of Department
**Create:** Name, Code, Description, Head (staff picker)

### Department Picker

Used in staff forms and other contexts to assign departments.

---

## 7. Appointment Scheduling

### Appointments List

**Route:** `/emr/appointments`

Shows all appointments with status-based filtering.

**Columns:** Patient, Provider, Type, Priority, Date/Time, Status

**Status filter chips:** All | Scheduled | Checked In | In Progress | Completed | Cancelled | No Show

### Scheduling an Appointment

1. Click **Add Appointment**
2. Fill in:
   - **Patient** (searchable — type to search by name/MRN/phone)
   - **Type** (select: Consultation, Follow-up, Emergency, Procedure, etc.)
   - **Priority** (select: Normal, Urgent, STAT)
   - **Date** (date picker)
   - **Time** (time picker)
   - **Provider** (staff picker — searches active staff)
   - **Reason** (autocomplete from previous reasons)
   - **Notes** (optional)
3. Click **Create**

### Check-In

From the appointments list or detail:
1. Click **Check In** on a scheduled appointment
2. The appointment status changes to **Checked In**
3. A visit is automatically started for this appointment

### Completing an Appointment

1. Click **Complete** on an in-progress appointment
2. Status changes to **Completed**

### Marking No-Show

1. Click **No Show** on a scheduled appointment that wasn't attended
2. Status changes to **No Show**

### Cancelling an Appointment

1. Click **Cancel** on an appointment
2. Enter a **cancellation reason** (required)
3. Confirm the cancellation

### Editing an Appointment

1. Click **Edit** on an open appointment
2. Modify date, provider, notes, etc.
3. Click **Save**

---

## 8. Visit Management

### Visits List

**Route:** `/emr/visits`

**Columns:** Patient, Provider, Visit Type, Start Time, End Time, Status

### Starting a Visit

1. Click **Add Visit**
2. Select patient, visit type, provider, and start datetime
3. Click **Create**

Note: Check-in from an appointment auto-starts a visit.

### Visit Detail

**Route:** `/emr/visits/:visitId`

Shows:
- Visit header (patient link, provider, start/end times)
- Linked **Encounters** tab
- Linked **Requests** tab

Actions:
- **End Visit** — Records stop datetime
- **Cancel Visit** — Cancels ongoing visit

---

## 9. Encounter Recording

### Encounters List

**Route:** `/emr/encounters`

**Columns:** Patient, Provider, Type, Datetime, Reason, Timer

### Recording an Encounter

1. Click **Add Encounter**
2. Fill in:
   - **Patient** (searchable)
   - **Encounter Type** (select)
   - **Provider** (staff picker)
   - **Datetime**
   - **Reason** (autocomplete from previous reasons)
   - **Notes** (optional)
3. Click **Create**

### Encounter Timer

Each encounter row for today shows a **live elapsed timer** (`HH:MM:SS`) that:
- Starts counting from the encounter datetime
- Updates in real-time
- Persists across page navigation (stored in localStorage)
- Shows in **blue** when running, **gray** when stopped

### Encounter Detail

**Route:** `/emr/encounters/:encounterId`

Shows:
- **Header:** Patient link, visit link, provider, datetime, reason, notes
- **Documentation Tab:** List of form submissions linked to this encounter
  - Each submission shows key field summaries
  - **View** — Opens the submission view modal
  - **Amend** — Opens the amend modal (pre-filled with existing data)

#### Actions from Encounter Detail
- **New Documentation** — Opens the documentation modal pre-filled with this encounter and patient
- **New Request** — Opens the clinical request form pre-filled with this encounter

---

## 10. Documentation (Dynamic Forms)

### Form Definitions

**Route:** `/emr/forms`

Manage the templates used for clinical documentation.

#### Listing Forms

**Columns:** Name, Code, Category, Version, Status (Draft/Published), Last Updated

**Search:** Filter by name or code

**Actions per form:**
- **Edit** → Opens the form builder
- **Publish** → Makes the form available for documentation
- **Unpublish** → Hides the form from documentation

### Form Builder

The form builder is a **visual drag-and-drop editor** for creating form templates:

#### Metadata Section
- **Name** (required) — Display name
- **Code** (required) — Unique identifier
- **Category** — e.g., "Clinical", "Nursing", "Administrative"
- **Description** — Help text

#### Field Editor
13 supported field types:

| Type | Description |
|---|---|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `number` | Numeric input with optional min/max |
| `date` | Date picker |
| `datetime` | Date + time picker |
| `select` | Dropdown with options |
| `radio` | Radio button group |
| `checkbox` | Single checkbox |
| `checkbox-group` | Multiple checkboxes |
| `table` | Data table with columns (text, number, textarea, date, checkbox) |
| `section` | Visual section divider with title |
| `tab` | Tab container for organizing fields |
| `col` | Column layout container |

#### Builder Features
- **Drag-and-drop reorder** — Grab the grip handle to reorder fields
- **Move up/down** — Arrow buttons for precise positioning
- **Duplicate** — Copy a field with one click
- **Delete** — Remove a field (with confirmation)
- **Live Preview** — See how the form will render
- **JSON View** — Raw JSON editor with Apply/Discard buttons
- **Tabbed organization** — Group fields into tabs within the form

#### Publishing
1. Build your form in the builder
2. Click **Save** (auto-bumps version when schema changes)
3. Click **Publish** from the forms list
4. The form is now available in the Documentation modal

### Creating Documentation

1. From an encounter detail, patient profile, or directly, click **New Documentation**
2. The **Documentation Modal** opens:
   - **Form selector** — Lists published forms you have access to (controlled by `form_access` table)
   - **Patient** — Pre-filled from context or searchable
   - **Encounter** — Pre-filled from context or searchable
3. Select a form → The **Dynamic Form** renders with all defined fields
4. Fill in the form data
5. Choose:
   - **Save Draft** — Saves without finalizing
   - **Submit** — Finalizes the documentation

### Viewing a Submission

1. Click a submission row in any documentation tab
2. **Submission View Modal** opens showing:
   - Schema-labeled field values
   - Submission metadata (who, when, status)
   - **Amendments count** and version navigation
   - **Print** / **PDF** buttons

### Amending a Submission

1. From the view modal, click **Amend**
2. **Submission Amend Modal** opens with the form pre-filled
3. Make changes
4. Click **Submit** — Creates a new submission preserving the original (amend chain)
5. Navigate between versions: Original → Amend 1 → Amend 2 → …

### PDF Export

From the view modal, click **Print / PDF** to generate a formatted PDF of the submission.

---

## 11. Clinical Requests (Orders)

### Requests List

**Route:** `/emr/requests`

**Columns:** Patient, Type, Priority, Provider, Status, Created, Sync Status

**Status filter chips:** All | Requested | In Progress | Completed | Cancelled | Rejected

### Creating a Request

1. Click **Add Request**
2. Fill in:
   - **Patient** (searchable)
   - **Type** (select: Prescription, Lab, Radiology, Other Test)
   - **Priority** (select: Normal, Urgent, STAT)
   - **Provider** (staff picker)
   - **Diagnosis**
   - **Notes**
   - **Line Items** (dynamic table):
     - Name, Code, Dose, Frequency, Route, Quantity, Instructions
     - Add/remove rows with +/× buttons
3. Click **Create**

### Request Detail

**Route:** `/emr/requests/:requestId`

Shows:

#### Header
- Patient link, encounter link, visit link
- Provider name
- External order ID (with **copy to clipboard** button)
- Sync status badge

#### Activity Timeline
Visual timeline of all request events:
- 🟢 **Created** — With timestamp and actor
- 🔵 **Status transitions** — REQUESTED → IN_PROGRESS → COMPLETED
- 🟡 **Notes** — Free-text notes with actor and timestamp
- 🔴 **Cancelled/Rejected** — With reason

#### Line Items Tab
Table of ordered items with name, code, dose, frequency, route, quantity

#### Documentation Tab
Form submissions linked to this request (via the request's encounter or visit)

### Status Transactions

From the request detail, available actions depend on current status:

| Current Status | Available Actions |
|---|---|
| REQUESTED | Mark In Progress, Mark Complete, Cancel (requires reason), Reject (requires reason) |
| IN_PROGRESS | Mark Complete, Cancel (requires reason), Reject (requires reason) |
| COMPLETED | *(terminal)* |
| CANCELLED | *(terminal)* |
| REJECTED | *(terminal)* |

Each transition:
1. Opens a confirmation dialog
2. If cancel/reject, requires a reason
3. Records the transition on the timeline
4. Logs in the audit trail

### Adding a Note

1. From the request detail, type in the **Note Composer** text area
2. Click **Add Note**
3. The note appears on the timeline with your name and timestamp

### Re-syncing to External System

For LAB and PRESCRIPTION requests:
1. Click **Re-sync** button in the request detail
2. The system re-runs the external sync
3. Sync status updates live (PENDING → SYNCED or FAILED)

---

## 12. Navigation Patterns

The EMR module uses deep-linking extensively:

| From | To | How |
|---|---|---|
| Patient profile → Appointment | Schedule from profile | Click **Schedule** → form pre-filled |
| Patient profile → Request | View order detail | Click request row |
| Encounter detail → Patient | View patient profile | Click patient name link |
| Encounter detail → Visit | View visit detail | Click visit link |
| Request detail → Encounter | View encounter | Click encounter link |
| Request detail → Patient | View patient profile | Click patient name |
| Visit detail → Encounter | View encounter | Click encounter row |

---

## 13. Tips & Shortcuts

| Feature | How To |
|---|---|
| **Quick patient search** | Use the sidebar MRN search or type in any patient picker |
| **Dirty-state guard** | If you have unsaved changes and try to navigate, you'll be prompted |
| **Live encounter timer** | Timers persist across navigation via localStorage |
| **Form builder JSON** | Switch to JSON view for precise control over the schema |
| **Amend chain** | View modal shows amendment count; navigate versions with arrows |
| **Copy external ID** | Click the copy icon next to external order IDs |
| **Provider autocomplete** | Start typing in any provider field to search active staff |

---

## 14. Troubleshooting

| Issue | Solution |
|---|---|
| Patient not found | Check MRN is correct; try searching by name or phone |
| Form not appearing in documentation | Check `form_access` table — your role may not have access |
| Timer not showing | The encounter must be today; check localStorage is enabled |
| Encounter timer reset | localStorage was cleared; timer restarts from encounter datetime |
| Request sync failed | Click Re-sync; check the error message in sync status |
| Documentation modal empty | Ensure at least one form definition is published |
| Edit modal won't close | Dirty-state guard is active — save or discard changes first |

---

## 15. Related Documentation

- [MANUAL.emr.md](./MANUAL.emr.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
