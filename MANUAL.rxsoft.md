# MANUAL — RxSoft Backend

**Service:** `rxsoft-backend`
**Port:** 8080
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The RxSoft Backend is the primary business-logic service for pharmacy and retail healthcare operations. It manages product catalogs, inventory, sales, purchases, customers, pricing, accounting, and integrations with external services.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- Docker (for PostgreSQL + MongoDB)
- Identity service running on port 8092 (for JWT auth)

### Install & Run

```bash
cd rxsoft
docker compose up -d      # Start PostgreSQL + MongoDB
yarn install
yarn start:dev
```

The API starts on **http://localhost:8080**.
Swagger docs at **http://localhost:8080/api/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8080 | Server port |
| `DB_TYPE` | postgres | Primary database type |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_NAME` | rxsoft | PostgreSQL database name |
| `DB_SYNCHRONIZE` | true | Auto-create tables (dev) |
| `DB_DROP_SCHEMA` | true | Drop schema on start |
| `USE_IN_MEMORY_REPOS` | false | Use SQL.js in-memory instead of PG |
| `SEED_ON_START` | true | Seed on startup |
| `JWT_ACCESS_SECRET` | admin-access-secret | JWT signing secret |
| `JWT_REFRESH_SECRET` | admin-refresh-secret | JWT refresh secret |
| `IDENTITY_SERVICE_URL` | http://localhost:8092 | Identity service endpoint |
| `INTERNAL_API_KEY` | rxsoft-internal-key | Service-to-service auth |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
| `USE_MONGODB` | true | Enable MongoDB for APM campaigns |
| `MONGODB_URI` | — | MongoDB connection string |
| `EHEALTHWARES_CACHE_ENABLED` | true | Cache eHealthwares responses |
| `EHEALTHWARES_CACHE_TTL_SECONDS` | 300 | Cache TTL |

---

## 4. Architecture

### Dual Architecture

| Pattern | Used By |
|---|---|
| **Standard** (Controller → Service → TypeORM Repository) | Most modules |
| **Clean Architecture** (Controller → Use Case → Repository Interface → TypeORM Impl) | Some newer modules |

### Module Map (25 modules)

| Module | Description | Database |
|---|---|---|
| `catalog` | Product/service catalog | PostgreSQL |
| `categories` | Product categories | PostgreSQL |
| `manufacturers` | Manufacturer registry | PostgreSQL |
| `inventory` | Stock management | PostgreSQL |
| `warehouses` | Warehouse management | PostgreSQL |
| `sales` | Sales orders and transactions | PostgreSQL |
| `purchases` | Purchase orders | PostgreSQL |
| `customers` | Customer management | PostgreSQL |
| `pricing` | Pricing rules and tiers | PostgreSQL |
| `receivables` | Accounts receivable | PostgreSQL |
| `accounting` | Financial transactions, ledgers | PostgreSQL |
| `apm` | APM campaign management | MongoDB |
| `audit` | Audit logging | PostgreSQL |
| `ehealthwares` | External API integration | PostgreSQL + cache |
| `upload` | File/image upload via Cloudinary | Cloudinary |
| `reports` | Reporting engine | PostgreSQL |
| `identity` | User proxy to identity service | — (proxy) |
| `lis` | LIS proxy to LIMS backend | — (proxy) |
| `organizations` | Multi-tenant org management | PostgreSQL |
| `organisation-config` | Org-level settings | PostgreSQL |
| `users-proxy` | User management proxy | — (proxy) |
| `user-pos-config` | POS configuration per user | PostgreSQL |
| `website` | Website content management | PostgreSQL |
| `health` | Health check endpoint | — |
| `seeds` | Database seeding | — |

---

## 5. Authentication

All endpoints require a valid JWT Bearer token from the identity service.

```bash
# Get token
curl -X POST http://localhost:8092/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token
curl http://localhost:8080/api/catalog \
  -H "Authorization: Bearer <token>"
```

---

## 6. Domain Guides

### 6.1 Catalog

| Operation | Method | Endpoint |
|---|---|---|
| Create product | `POST` | `/api/catalog` |
| List products | `GET` | `/api/catalog?search=&page=&limit=&sort=` |
| Get product by ID | `GET` | `/api/catalog/:id` |
| Update product | `PATCH` | `/api/catalog/:id` |
| Delete product | `DELETE` | `/api/catalog/:id` |

**Create product:**
```json
{
  "name": "Amoxicillin 500mg",
  "code": "AMX-500",
  "categoryId": "...",
  "manufacturerId": "...",
  "uomId": "...",
  "sellingPrice": 15.00,
  "costPrice": 8.50,
  "reorderLevel": 100,
  "isActive": true
}
```

### 6.2 Inventory

| Operation | Method | Endpoint |
|---|---|---|
| Get stock levels | `GET` | `/api/inventory?warehouseId=&search=` |
| Adjust stock | `POST` | `/api/inventory/adjust` |
| Transfer stock | `POST` | `/api/inventory/transfer` |
| Stock history | `GET` | `/api/inventory/history/:itemId` |

### 6.3 Sales

| Operation | Method | Endpoint |
|---|---|---|
| Create sale | `POST` | `/api/sales` |
| List sales | `GET` | `/api/sales?page=&startDate=&endDate=` |
| Get sale by ID | `GET` | `/api/sales/:id` |
| Void sale | `POST` | `/api/sales/:id/void` |

**Create sale:**
```json
{
  "customerId": "...",
  "warehouseId": "...",
  "items": [
    { "itemId": "...", "quantity": 2, "unitPrice": 15.00 }
  ],
  "paymentMethod": "CASH",
  "amountPaid": 30.00
}
```

### 6.4 Purchases

| Operation | Method | Endpoint |
|---|---|---|
| Create purchase | `POST` | `/api/purchases` |
| List purchases | `GET` | `/api/purchases?page=&startDate=&endDate=` |
| Receive purchase | `POST` | `/api/purchases/:id/receive` |

### 6.5 Customers

| Operation | Method | Endpoint |
|---|---|---|
| Create customer | `POST` | `/api/customers` |
| List customers | `GET` | `/api/customers?search=&page=` |
| Get customer by ID | `GET` | `/api/customers/:id` |
| Update customer | `PATCH` | `/api/customers/:id` |

### 6.6 Pricing

| Operation | Method | Endpoint |
|---|---|---|
| Create pricing rule | `POST` | `/api/pricing` |
| List pricing rules | `GET` | `/api/pricing?search=` |
| Update pricing rule | `PATCH` | `/api/pricing/:id` |

Supports tier-based pricing, customer-specific pricing, and promotional discounts.

### 6.7 APM Campaigns (MongoDB)

| Operation | Method | Endpoint |
|---|---|---|
| Create campaign | `POST` | `/api/apm` |
| List campaigns | `GET` | `/api/apm?search=&status=` |
| Update campaign | `PATCH` | `/api/apm/:id` |

APM campaigns use MongoDB for flexible schema and change stream support.

### 6.8 Upload

```bash
POST /api/upload
Content-Type: multipart/form-data

file: <image-file>
```

Returns Cloudinary URL. Requires `CLOUDINARY_*` env vars.

---

## 7. Databases

| Database | Tech | Purpose |
|---|---|---|
| PostgreSQL | TypeORM 0.3 | Primary data (catalog, sales, customers, etc.) |
| MongoDB | Mongoose 9 | APM campaigns (change streams, flexible schema) |
| SQL.js (in-memory) | sql.js | Optional lightweight storage for testing |

---

## 8. Key Patterns

### Multi-Tenancy
All data is scoped by `organizationId` from the JWT payload.

### Seeding
Idempotent upserts via `DatabaseSeedService`. Gated by `SEED_ON_START`.

### Caching
`AppCacheService` backed by Redis (optional) or in-memory Map. Used for eHealthwares integration.

### Sort Safety
`resolveSortColumn()` utility prevents SQL injection in sort parameters via an allow-list.

---

## 9. Commands

```bash
yarn start:dev         # Dev server with watch
yarn build             # Compile TypeScript
yarn start:prod        # Production start
yarn test              # Unit tests
yarn test:e2e          # End-to-end tests
yarn seed              # Run database seeds
yarn db:reset-and-seed # Drop, recreate, and seed
yarn smoke             # Run smoke workflow test
```

---

## 10. Troubleshooting

| Issue | Solution |
|---|---|
| Connection refused | Ensure `docker compose up -d` started PostgreSQL + MongoDB |
| JWT 401 errors | Verify `JWT_ACCESS_SECRET` matches identity service |
| MongoDB errors | Check `USE_MONGODB=true` and `MONGODB_URI` are set |
| Cloudinary upload fails | Verify `CLOUDINARY_*` env vars |
| Duplicate DTO patterns | Known debt — `ListQueryDto` vs `PaginationQueryDto` |

---

## 11. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [AGENTS.md](../AGENTS.md) — Monorepo overview
