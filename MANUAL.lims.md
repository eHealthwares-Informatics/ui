# MANUAL — RxSoft LIS Backend

**Service:** `rxsoft-lis-backend`
**Port:** 8091
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Laboratory Information System (LIS) backend manages lab workflows: ordering tests, tracking specimens, recording results, and integrating with external health systems via the interoperability switch.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- PostgreSQL running locally or via Docker
- Identity service running on port 8092 (for JWT auth)

### Install & Run

```bash
cd lims
npm install
cp .env.example .env    # edit DB credentials if needed
npm run start:dev
```

The API starts on **http://localhost:8091**.
Swagger docs at **http://localhost:8091/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8091 | Server port |
| `DB_TYPE` | postgres | Database type |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_NAME` | lis | Database name |
| `DB_SYNCHRONIZE` | false | Auto-create tables |
| `DB_DROP_SCHEMA` | false | Drop schema on start |
| `TYPEORM_LOGGING` | false | Query logging |
| `SEED_ON_START` | false | Seed on startup |
| `JWT_ACCESS_SECRET` | admin-access-secret | JWT signing secret |
| `INTEROP_API_KEY` | lis-interop-key-dev | API key for interop switch |
| `INTEROP_SWITCH_WEBHOOK_URL` | http://localhost:8090/api/v1/flow/messages | Webhook URL |
| `RXSOFT_BACKEND_URL` | http://localhost:8080 | RxSoft backend URL |

---

## 4. Architecture

```
rxsoft-lis-backend ←→ healthcare-interoperability-switch (webhooks)
         ↕
   rxsoft-backend (LIS proxy module)
```

### Module Structure

| Directory | Purpose |
|---|---|
| `src/modules/lis/` | Core LIS module: lab orders, tests, specimens, results |
| `src/modules/health/` | Health check endpoint |
| `src/common/` | Guards (`JwtAuthGuard`), decorators (`@CurrentUser`), tenant-context helpers |
| `src/database/` | Seeding service and seed scripts |
| `src/shared/` | DTOs and shared utilities |

---

## 5. Authentication

All endpoints require a valid JWT Bearer token issued by the identity service.

**Obtaining a token:**
```bash
curl -X POST http://localhost:8092/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Using the token:**
```bash
curl http://localhost:8091/api/lis/orders \
  -H "Authorization: Bearer <token>"
```

The JWT payload includes `organizationId` for tenant scoping. Queries automatically filter by the authenticated user's organization.

---

## 6. Common Operations

### List Lab Orders
```bash
GET /api/lis/orders?page=1&limit=20&search=CBP
```

### Create a Lab Order
```bash
POST /api/lis/orders
Content-Type: application/json

{
  "patientId": "...",
  "encounterId": "...",
  "tests": [{ "testCode": "CBC", "testName": "Complete Blood Count" }],
  "priority": "STAT",
  "notes": "Fever workup"
}
```

### Update Order Status
```bash
PATCH /api/lis/orders/:id
Content-Type: application/json

{ "status": "IN_PROGRESS" }
```

### Submit Results
```bash
POST /api/lis/orders/:id/results
Content-Type: application/json

{
  "results": [
    { "testCode": "WBC", "value": "7.2", "unit": "x10^3/uL", "referenceRange": "4.5-11.0" }
  ]
}
```

---

## 7. Seeding

```bash
# Run seed scripts
npm run seed

# Or auto-seed on startup
# Set SEED_ON_START=true in .env
```

---

## 8. Database

- **Type:** PostgreSQL
- **ORM:** TypeORM 0.3
- **Migrations:**
  ```bash
  npm run migration:run     # apply migrations
  npm run migration:revert  # rollback last migration
  ```

---

## 9. Testing

```bash
# Integration tests (runs sequentially)
npm run test:integration

# Or with npx
npx jest --config jest.integration.config.ts --runInBand
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
| `ECONNREFUSED` on DB | Ensure PostgreSQL is running and `DB_HOST`/`DB_PORT` are correct |
| JWT 401 errors | Check that `JWT_ACCESS_SECRET` matches the identity service |
| Tables not created | Set `DB_SYNCHRONIZE=true` for dev, or run `migration:run` |
| Interop webhook failures | Verify `INTEROP_SWITCH_WEBHOOK_URL` and `INTEROP_API_KEY` |

---

## 12. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [AGENTS.md](../AGENTS.md) — Monorepo overview
