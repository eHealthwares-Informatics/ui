# MANUAL — Healthcare Interoperability Switch

**Service:** `backend` (interop)
**Port:** 3000
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Healthcare Interoperability Switch is a protocol-agnostic message routing and transformation platform. It receives healthcare messages, routes them through configurable rules, maps between protocols (HL7 v2, FHIR R4, and a canonical model), and dispatches to external systems via TCP/MLLP or HTTP REST.

Inspired by the Postilion architecture.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- No database setup needed for dev (SQLite in-memory by default)

### Install & Run

```bash
cd interop
npm install
npm run dev    # ts-node development mode
```

The API starts on **http://localhost:3000**.
Swagger docs at **http://localhost:3000/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `DB_TYPE` | sqlite | Database type (`sqlite` or `postgres`) |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | postgres | PostgreSQL user |
| `DB_PASSWORD` | postgres | PostgreSQL password |
| `DB_NAME` | health_interop_db | Database name |
| `DB_LOGGING` | false | TypeORM query logging |
| `NODE_ENV` | development | Environment |
| `SWITCH_AE_ID` | switch | This switch's AE identifier |
| `SWITCH_APPLICATION_NAME` | HEALTH_INTEROPERABILITY_SWITCH | Application name for HL7 |
| `CODING_CONCEPT_BASE_URL` | http://127.0.0.1:8004/api/v1 | Healthcare Concepts API base |
| `ENABLE_ROUTE_VALIDATIONS` | true | Toggle route validation |

---

## 4. Architecture

### Module Structure

| Module | Description |
|---|---|
| `ae` | Application Entity registry — CRUD for system endpoints |
| `routing` | Rule-based message routing with conditions |
| `mapping` | Template-based message transformation |
| `hl7` | HL7 v2 parser, transformer, TCP bridge (port 2575) |
| `fhir` | FHIR R4 validator, transformer, HTTP bridge |
| `event` | Real-time audit and event tracing |
| `core` | Canonical data models (Patient, Order), shared types |
| `health` | Health check endpoint |
| `validation` | Message validation rules |

### Data Flow

```
External System
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/v1/flow/healthstack/order    │
│  POST /api/v1/flow/healthstack/patient  │
└─────────────────┬───────────────────────┘
                  ▼
        ┌─────────────────┐
        │  AE Resolution   │  Look up source & destination AEs
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Route Rules     │  Evaluate routing conditions
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Source Mapping  │  Source Protocol → Canonical Model
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Target Mapping  │  Canonical Model → Target Protocol
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Bridge Dispatch │  TCP (HL7) or HTTP (FHIR)
        └────────┬────────┘
                 ▼
        ┌─────────────────┐
        │  Event Tracing   │  Audit log
        └─────────────────┘
```

---

## 5. API Reference

### 5.1 Application Entities

| Operation | Method | Endpoint |
|---|---|---|
| List all AEs | `GET` | `/api/v1/aes` |
| Create AE | `POST` | `/api/v1/aes` |
| Get AE by ID | `GET` | `/api/v1/aes/:id` |
| Update AE | `PUT` | `/api/v1/aes/:id` |
| Delete AE | `DELETE` | `/api/v1/aes/:id` |

**Create AE:**
```json
{
  "name": "DCM4CHEE PACS",
  "type": "DESTINATION",
  "protocol": "HL7",
  "endpoint": "192.168.1.100",
  "port": 2575,
  "description": "DICOM archive"
}
```

### 5.2 Message Processing

#### Process Order
```bash
POST /api/v1/flow/healthstack/order
Content-Type: application/json

{
  "message": "HL7 raw message or structured payload",
  "sourceAE": "healthstack",
  "targetAE": "dcm4chee"
}
```

#### Process Patient
```bash
POST /api/v1/flow/healthstack/patient
Content-Type: application/json

{
  "message": "HL7 raw message or structured payload"
}
```

### 5.3 Health Check

```bash
GET /health
```

---

## 6. Protocol Bridges

### HL7 v2 Bridge
- **Transport:** TCP/MLLP on port 2575
- **Parser:** Full HL7 v2.x message parsing
- **Transformer:** HL7 ↔ Canonical model mapping
- **Use case:** Sending to PACS systems (DCM4CHEE), lab systems

### FHIR R4 Bridge
- **Transport:** HTTP REST
- **Validator:** FHIR R4 resource validation
- **Transformer:** FHIR ↔ Canonical model mapping
- **Use case:** Sending to OpenELIS, OpenMRS

### Canonical Model
Internal representation that decouples source and target protocols:
- `Patient` — demographics, identifiers, contacts
- `Order` — lab orders, prescriptions, radiology requests

---

## 7. Demo Data

On startup, the service auto-seeds:
- **AEs:** Healthstack HL7, DCM4CHEE HL7, OpenELIS FHIR
- **Mappings:** HL7 ↔ Canonical, FHIR ↔ Canonical templates
- **Routes:** Healthstack → DCM4CHEE, Healthstack → OpenELIS

---

## 8. Database

- **Development:** SQLite in-memory (no setup required)
- **Production:** PostgreSQL with connection pooling

```bash
# Switch to PostgreSQL in .env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=health_interop_db
```

---

## 9. Production Build

```bash
npm run build
npm run start:prod
```

---

## 10. Troubleshooting

| Issue | Solution |
|---|---|
| HL7 connection refused | Check target system is listening on the configured port |
| FHIR validation errors | Verify resource conforms to FHIR R4 spec |
| Route not found | Check AE registrations and routing rules |
| SQLite data lost | Expected — SQLite is in-memory; use PostgreSQL for persistence |

---

## 11. Roadmap

- [ ] Phase 5: React dashboard for AE/route management
- [ ] Phase 6: Graph visualization of routing topology
- [ ] Phase 7: Trace explorer for message history

---

## 12. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [AGENTS.md](../AGENTS.md) — Monorepo overview
