# RxSoft Backend Fleet — Product Requirements Document

**Version:** 1.0
**Date:** 2026-08-28
**Status:** Active Development

---

## 1. Executive Summary

RxSoft is a modular healthcare platform comprising seven independent backend services, each owned as a separate NestJS application within a monorepo. The platform supports pharmacy operations (catalog, inventory, sales, purchases), clinical workflows (EMR, laboratory), interoperability with external health systems, patient engagement (multi-channel conversations), identity management, and centralized data seeding.

The backend fleet is designed for multi-tenancy, horizontal scalability, and protocol-level interoperability with standard healthcare formats (HL7 v2, FHIR R4).

---

## 2. System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           RxSoft Backend Fleet                           │
├──────────┬──────────┬──────────┬──────────┬──────────┬─────────┬────────┤
│  identity│  rxsoft  │   emr    │   lims   │ interop  │conv.-eng│  seed  │
│  :8092   │  :8080   │  :8094   │  :8091   │  :3000   │  :8090  │ :8093  │
├──────────┴──────────┴──────────┴──────────┴──────────┴─────────┴────────┤
│    PostgreSQL (shared)    │    MongoDB    │    Cloudinary    │  Redis   │
└───────────────────────────┴───────────────┴──────────────────┴──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              HL7/MLLP TCP    HTTP REST       WhatsApp/SMS/
              (port 2575)    (FHIR R4)       Email/Telegram
```

---

## 3. Backend Services

### 3.1 RxSoft Identity (`identity`, port 8092)

**Purpose:** Centralized authentication and authorization for the entire platform.

**Core Requirements:**
- User registration, login, and token lifecycle management (access + refresh JWT)
- Role-based access control with fine-grained permission codes
- Organization and location management for multi-tenancy
- Service-to-service authentication via internal API keys
- Issues JWT tokens consumed by all other backend services

**Key Entities:**
- Users (UUID PK, username, email, org/location assignment)
- Roles (with permission code arrays)
- Permissions (grouped by module)
- Organizations (tenant boundaries)
- Locations (scoped to organizations)

**API Surface:**
- `POST /auth/login` — Authenticate and receive JWT pair
- `POST /auth/refresh-token` — Rotate refresh token
- `GET /auth/me` — Current user profile
- CRUD for `/users`, `/roles`, `/organizations`, `/locations`
- `GET /permissions/modules` — Permission catalog

**Technical Notes:**
- PostgreSQL with TypeORM; `synchronize: true` in dev
- Clean architecture with use-case classes and repository interfaces
- String-based TypeORM relations to avoid circular dependencies
- Tenant scoping: `TenantContext` helper derived from JWT payload

---

### 3.2 RxSoft Backend (`rxsoft`, port 8080)

**Purpose:** Primary business-logic backend for pharmacy and retail healthcare operations.

**Core Requirements:**
- Product/service catalog management with categories and manufacturers
- Inventory and warehouse management with stock tracking
- Sales and purchase order processing
- Customer management and loyalty
- Pricing rules, tiers, and receivables
- APM campaign management (MongoDB-backed)
- eHealthwares external API integration with caching
- LIS proxy (delegates to the LIMS backend)
- Image upload via Cloudinary
- Organization-level configuration

**Module Map (25 modules):**

| Module | Description |
|---|---|
| `accounting` | Financial transactions, ledgers |
| `apm` | APM campaigns (MongoDB change streams) |
| `audit` | Audit logging |
| `catalog` | Product/service catalog |
| `categories` | Product categories |
| `customers` | Customer management |
| `ehealthwares` | External API integration with Redis/in-memory caching |
| `identity` | User proxy to `rxsoft-identity` |
| `inventory` | Stock management |
| `lis` | LIS proxy to `rxsoft-lis-backend` |
| `manufacturers` | Manufacturer registry |
| `organisation-config` | Org-level settings |
| `organizations` | Multi-tenant org management |
| `pricing` | Pricing rules and tiers |
| `purchases` | Purchase orders |
| `receivables` | Accounts receivable |
| `reports` | Reporting engine |
| `sales` | Sales orders and transactions |
| `upload` | File/image upload via Cloudinary |
| `warehouses` | Warehouse management |
| `website` | Website content management |

**Technical Notes:**
- Triple-database: PostgreSQL (primary) + MongoDB (APM) + SQL.js in-memory (optional)
- JWT shared secret with identity service
- Sort allow-list utility (`resolveSortColumn`) to prevent SQL injection
- Known debt: two competing DTO patterns (`ListQueryDto` vs `PaginationQueryDto`)

---

### 3.3 EMR Service (`emr`, port 8094)

**Purpose:** Electronic Medical Records — patient administration, clinical workflows, dynamic documentation, and clinical orders.

**Core Requirements:**

| Domain | Capabilities |
|---|---|
| **Patients** | Registration, search (name/MRN/phone), profile view, demographics editing with audit diffs, MRN lookup |
| **Staff** | Registration with role types (Doctor/Nurse/Technician/etc.), searchable provider picker, identity-user linking |
| **Appointments** | Scheduling, check-in (auto-starts visit), completion, no-show, cancellation with reason |
| **Visits** | Start/end/cancel, linked encounters and requests |
| **Encounters** | Recording, live timer, detail view with documentation tab |
| **Documentation** | Dynamic form builder (13 field types), published form access control, submissions with amend chains, PDF export |
| **Clinical Requests** | Orders (Prescription/Lab/Radiology/Other), lifecycle transitions with audit, notes, external sync, re-sync |
| **Audit Trail** | Request lifecycle events, patient edit diffs, HTTP-level audit interceptor |
| **Dashboard** | Daily metrics (appointments by status, provider load) |

**Technical Notes:**
- PostgreSQL with TypeORM; auto-syncs schema on startup
- Identity proxy resolves users/locations/organizations
- Form access control via `form_access` table (user/role → form codes, wildcards)
- PDF generation via pdfmake + jsdom

---

### 3.4 LIMS Backend (`lims`, port 8091)

**Purpose:** Laboratory Information System — lab order management, test definitions, specimen tracking, and results.

**Core Requirements:**
- Lab order creation and lifecycle management
- Test catalog and ordering
- Specimen collection and tracking
- Results entry and management
- Integration with the interoperability switch via webhooks
- Proxy integration with the main RxSoft backend

**Architecture:**
```
rxsoft-lis-backend ←→ healthcare-interoperability-switch (webhooks)
         ↕
   rxsoft-backend (LIS proxy module)
```

**Technical Notes:**
- PostgreSQL with TypeORM; migration-based schema management
- JWT shared secret (same as identity service)
- Tenant scoping via `TenantContext`
- Scheduler support via `@nestjs/schedule`

---

### 3.5 Healthcare Interoperability Switch (`interop`, port 3000)

**Purpose:** Protocol-agnostic message routing and transformation platform for healthcare interoperability.

**Core Requirements:**
- Application Entity (AE) registry — CRUD for system endpoints
- Rule-based message routing with configurable conditions
- Template-based message mapping (HL7 ↔ Canonical ↔ FHIR)
- HL7 v2 parser and TCP/MLLP bridge (port 2575)
- FHIR R4 validator and HTTP REST bridge
- Real-time audit and event tracing
- Canonical data models (Patient, Order)
- Auto-seeding of demo AEs, mappings, and routing rules

**End-to-End Flow:**
1. Message arrives at `POST /api/v1/flow/healthstack/order` or `/patient`
2. AE lookups and routing rules determine destination
3. Source protocol → canonical model mapping
4. Canonical model → target protocol mapping
5. Dispatch via TCP (HL7) or HTTP (FHIR)
6. Event tracing and audit

**Technical Notes:**
- SQLite (dev) / PostgreSQL (prod) with TypeORM
- JWT + Passport authentication
- Phases 1–4 complete; phases 5–7 planned (React dashboard, graph visualization, trace explorer)
- Designed after Postilion architecture

---

### 3.6 Conversation Engine (`conversation`, port 8090)

**Purpose:** Multi-channel patient engagement engine — questionnaire-driven conversations across SMS, WhatsApp, Email, and Telegram.

**Core Requirements:**
- Questionnaire definitions with branching questions and option lists
- Conversation lifecycle management (start, answer, complete, stop)
- Participant lookup and creation by phone number
- Channel abstraction: senders, processors, webhook endpoints
- Workflow integration: workflow instances linked to conversations, state transitions, HTTP_POST actions
- Event bus for conversation lifecycle events
- Inbound/outbound message exchange logging
- Google Sheets integration for questionnaire import

**Supported Channels:**
- SMS (BulkSMS / NBSMS)
- WhatsApp Business API
- Email (SMTP)
- Telegram Bot API

**End-to-End Flow:**
1. Inbound message → participant lookup (create if new)
2. Conversation resolved or created from questionnaire
3. Workflow instance created (if linked)
4. Questions rendered and sent via resolved channel
5. Answers validated and processed (invalid → resend, valid → advance)
6. Events emitted → workflow transitions → actions executed

**Technical Notes:**
- MongoDB with replica set (required for change streams)
- Mongoose 9 ODM with collection prefixing
- Production runs with `--max-old-space-size=4096`
- Husky pre-commit hooks

---

### 3.7 Seed Service (`seed`, port 8093)

**Purpose:** Centralized data import and seeding for the entire backend fleet.

**Core Requirements:**
- Multi-source ingestion: Google Sheets, CSV, JSON, inline
- Multi-target upsert: writes directly to each backend's database (no API dependency)
- Idempotent operations with conflict-key-based upserts
- Relation resolution via in-memory caches
- Full-sync mode with soft-delete for removed rows
- Organization scoping for multi-tenant data
- HTTP API for on-demand imports and health checks
- CLI mode for batch operations

**Supported Targets:**
- `backend` (rxsoft PostgreSQL)
- `lis` (LIMS PostgreSQL)
- `identity` (Identity PostgreSQL)
- `concepts` (Healthcare Concepts PostgreSQL)
- `conversation` (Conversation MongoDB)
- `interop` (Interop database)

**API Surface:**
- `POST /api/imports` — Run all or specific target/entity imports
- `GET /api/imports/health` — Liveness probe
- CLI: `npm run seed` — Boot context, import, exit

**Technical Notes:**
- NestJS with Swagger documentation
- Config-driven entity registration (`import-config.ts`)
- Targets without `SEED_DB_*_URL` are skipped (reported, not failed)

---

## 4. Cross-Cutting Concerns

### 4.1 Authentication & Authorization
- **Identity service** issues JWT access + refresh tokens
- All other services validate JWTs using a shared secret (`JWT_ACCESS_SECRET`)
- Service-to-service auth via `INTERNAL_API_KEY` header
- Permission codes assigned per role, included in JWT payload

### 4.2 Multi-Tenancy
- `organizationId` in JWT payload scopes all data queries
- `TenantContext` helper applies `WHERE org_id = X OR org_id IS NULL` (global admins see everything)
- Location scoping for location-bound data

### 4.3 Database Strategy
| Database | Used By | Purpose |
|---|---|---|
| PostgreSQL | identity, rxsoft, emr, lims, seed, interop | Primary relational data |
| MongoDB | rxsoft (APM), conversation, seed (conversation target) | Flexible schema, change streams |
| SQLite | interop (dev/test) | Zero-config development |
| SQL.js | rxsoft (optional) | In-memory testing |

### 4.4 Inter-Service Communication
- **Sync:** Direct HTTP calls with JWT or internal API key
- **Async:** Interoperability switch webhooks for protocol translation
- **Shared:** Common JWT secret and tenant-scoping patterns

### 4.5 API Documentation
- All services expose Swagger UI at `/docs` (or `/api/docs` for rxsoft/conversation)

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥22 |
| Framework | NestJS 11 |
| Language | TypeScript 5.x |
| Relational DB | PostgreSQL (TypeORM 0.3) |
| Document DB | MongoDB (Mongoose 9) |
| Validation | class-validator + class-transformer |
| Auth | JWT (@nestjs/jwt) |
| HTTP Client | Axios |
| Scheduler | @nestjs/schedule |
| File Storage | Cloudinary |
| API Docs | @nestjs/swagger |
| Testing | Jest + Supertest |
| Package Manager | yarn (rxsoft, conversation) / npm (others) |

---

## 6. Deployment Architecture

- Each service runs independently (separate ports, separate processes)
- Docker Compose available for local development (PostgreSQL, MongoDB replica set)
- Environment-based configuration via `.env` files
- Production: `node dist/main` with PM2 or container orchestration
- Nginx reverse proxy for frontend static files

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| API response time (p95) | < 200ms |
| Authentication latency | < 100ms |
| Database migrations | Zero-downtime (TypeORM migrations) |
| Data seeding | Idempotent, re-runnable |
| Audit trail | All state-changing operations logged |
| API documentation | Auto-generated Swagger for all endpoints |
| Test coverage | Unit + integration + e2e per service |

---

## 8. Known Technical Debt

1. **rxsoft**: Two competing DTO patterns (`ListQueryDto` vs `PaginationQueryDto`)
2. **rxsoft**: Table prefix migration (`emr_*` → unprefixed) pending
3. **interop**: React dashboard not yet implemented (phases 5–7)
4. **conversation**: Does not yet adopt standard `ListQueryDto` from search architecture
5. **emr**: Form definitions use `schemaJson`; client-side schema validator is a mirror that could drift

---

## 9. Future Roadmap

- [ ] Unified API gateway (single entry point for all backends)
- [ ] Interop dashboard (React) with graph visualization and trace explorer
- [ ] Conversation engine: Telegram channel, webhook URL management
- [ ] EMR: Appointment scheduling with recurring patterns
- [ ] LIMS:仪器 integration (instrument connectivity)
- [ ] Centralized logging and observability (OpenTelemetry)
- [ ] CI/CD pipeline per service
- [ ] Frontend monorepo consolidation (current frontend + damorex merge)
