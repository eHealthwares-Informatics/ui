# MANUAL — EMR Service

**Service:** `emr`
**Port:** 8094
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Electronic Medical Records (EMR) service handles the full clinical workflow: patient registration, scheduling, visits, encounters, dynamic form documentation, clinical orders (lab/prescription/radiology), and audit trails.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- PostgreSQL running locally or via Docker
- Identity service running on port 8092 (for JWT auth)

### Install & Run

```bash
cd emr
npm install
cp .env.example .env    # edit DB credentials if needed
npm run start:dev
```

The API starts on **http://localhost:8094**.
Swagger docs at **http://localhost:8094/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8094 | Server port |
| `DB_TYPE` | postgres | Database type |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_NAME` | emr | Database name |
| `DB_SYNCHRONIZE` | true | Auto-create tables (dev) |
| `DB_DROP_SCHEMA` | true | Drop schema on start |
| `TYPEORM_LOGGING` | false | Query logging |
| `SEED_ON_START` | true | Seed on startup |
| `JWT_ACCESS_SECRET` | admin-access-secret | JWT signing secret |
| `IDENTITY_SERVICE_URL` | http://localhost:8092 | Identity service URL |
| `INTERNAL_API_KEY` | rxsoft-internal-key | Service-to-service auth |

---

## 4. Architecture

### Module Structure

| Directory | Purpose |
|---|---|
| `src/modules/patients/` | Patient registration, search, demographics |
| `src/modules/staff/` | Staff records, role types, provider picker |
| `src/modules/appointments/` | Scheduling, check-in, completion, cancellation |
| `src/modules/visits/` | Visit lifecycle (start, end, cancel) |
| `src/modules/encounters/` | Encounter recording, live timer |
| `src/modules/forms/` | Dynamic form builder, form submissions, PDF export |
| `src/modules/requests/` | Clinical orders with lifecycle transitions |
| `src/modules/dashboard/` | Daily metrics |
| `src/modules/pdf/` | PDF generation (pdfmake + jsdom) |
| `src/modules/identity-proxy/` | User/location/org lookup via identity service |
| `src/modules/auth-proxy/` | JWT validation |
| `src/modules/seeds/` | Database seeding |

---

## 5. Authentication

All endpoints require a valid JWT Bearer token from the identity service.

```bash
# Get token
curl -X POST http://localhost:8092/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token
curl http://localhost:8094/patients \
  -H "Authorization: Bearer <token>"
```

---

## 6. Domain Guides

### 6.1 Patients

| Operation | Method | Endpoint |
|---|---|---|
| Register patient | `POST` | `/patients` |
| Search patients | `GET` | `/patients?search=&page=` |
| Get patient by ID | `GET` | `/patients/:id` |
| Get patient by MRN | `GET` | `/patients/by-mrn/:mrn` |
| Update demographics | `PATCH` | `/patients/:id` |

**Register a patient:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dateOfBirth": "1990-01-15",
  "phone": "+1234567890",
  "bloodGroup": "O+",
  "genotype": "AA"
}
```

MRN is auto-generated if not supplied. Duplicate MRNs are rejected.

### 6.2 Staff

| Operation | Method | Endpoint |
|---|---|---|
| Register staff | `POST` | `/staff` |
| List staff | `GET` | `/staff?search=&role=&isActive=true` |
| Update staff | `PATCH` | `/staff/:id` |

Role types: `DOCTOR`, `NURSE`, `TECHNICIAN`, `THERAPIST`, `ADMIN`, `SUPPORT`

### 6.3 Appointments

| Operation | Method | Endpoint |
|---|---|---|
| Schedule appointment | `POST` | `/appointments` |
| Check in patient | `POST` | `/appointments/:id/check-in` |
| Complete appointment | `POST` | `/appointments/:id/complete` |
| Mark no-show | `POST` | `/appointments/:id/no-show` |
| Cancel appointment | `POST` | `/appointments/:id/cancel` |
| Update appointment | `PATCH` | `/appointments/:id` |

**Schedule:**
```json
{
  "patientId": "...",
  "type": "CONSULTATION",
  "priority": "NORMAL",
  "appointmentDate": "2026-09-01",
  "appointmentTime": "10:00",
  "providerId": "...",
  "reason": "Annual checkup"
}
```

Check-in auto-starts a visit for the appointment.

### 6.4 Visits

| Operation | Method | Endpoint |
|---|---|---|
| Start visit | `POST` | `/visits` |
| End visit | `POST` | `/visits/:id/end` |
| Cancel visit | `POST` | `/visits/:id/cancel` |
| Get visit detail | `GET` | `/visits/:id` |

### 6.5 Encounters

| Operation | Method | Endpoint |
|---|---|---|
| Record encounter | `POST` | `/encounters` |
| Get encounter detail | `GET` | `/encounters/:id` |

The encounter detail page includes a Documentation tab listing linked form submissions.

### 6.6 Documentation (Dynamic Forms)

| Operation | Method | Endpoint |
|---|---|---|
| List available forms | `GET` | `/forms/available` |
| Create form definition | `POST` | `/form-definitions` |
| Update form definition | `PATCH` | `/form-definitions/:id` |
| Publish form | `POST` | `/form-definitions/:id/publish` |
| Unpublish form | `POST` | `/form-definitions/:id/unpublish` |
| Submit documentation | `POST` | `/form-submissions` |
| View submission | `GET` | `/form-submissions/:id` |
| Amend submission | `POST` | `/form-submissions/:id/amend` |
| Get PDF export | `GET` | `/form-submissions/:id/pdf` |
| List submissions by encounter | `GET` | `/form-submissions?encounterId=` |
| List submissions by patient | `GET` | `/form-submissions?patientId=` |
| Get amend chain | `GET` | `/form-submissions/:id/chain` |

**Form field types:** Text, Number, Date, Select, Multi-Select, Checkbox, Radio, Textarea, Table, Section, Tab, Column, File Upload

**Access control:** The `form_access` table maps user/role → form codes. Wildcards grant all forms. Users with no rows see all published forms.

### 6.7 Clinical Requests

| Operation | Method | Endpoint |
|---|---|---|
| Create request | `POST` | `/requests` |
| Transition status | `POST` | `/requests/:id/transition` |
| Add note | `POST` | `/requests/:id/note` |
| Get request detail | `GET` | `/requests/:id` |
| Get activity history | `GET` | `/requests/:id/history` |
| Re-sync to external | `POST` | `/requests/:id/sync` |
| Update request | `PATCH` | `/requests/:id` |

**Request types:** `PRESCRIPTION`, `LAB`, `RADIOLOGY`, `OTHER_TEST`

**Status flow:**
```
REQUESTED → IN_PROGRESS → COMPLETED
                         → CANCELLED (requires reason)
                         → REJECTED (requires reason)
```

Every transition is recorded in the audit trail with actor, timestamp, and metadata.

---

## 7. Database

- **Type:** PostgreSQL with TypeORM
- **Schema management:** Auto-syncs on startup (`synchronize: true` in dev)
- **Migrations:**
  ```bash
  npm run migration:run
  npm run migration:revert
  ```

---

## 8. Seeding

```bash
npm run seed
# Or set SEED_ON_START=true in .env
```

---

## 9. Testing

```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
```

---

## 10. Production Build

```bash
npm run build
npm run start:prod
```

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| Tables not created | Check `DB_SYNCHRONIZE=true` or run migrations |
| Identity service errors | Ensure identity service is running on port 8092 |
| PDF generation fails | Verify `pdfmake` and `jsdom` are installed |
| Form submissions missing | Check `form_access` table for user/role permissions |
| External sync failed | Check `POST /requests/:id/sync` for error details |

---

## 12. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [AGENTS.md](../AGENTS.md) — Monorepo overview
