# FRONTEND MANUAL — Seed Service

**Frontend routes:** None (CLI / HTTP API only)
**Backend:** `seed` (port 8093)

---

## 1. What You Can Do

The Seed service does not have a dedicated frontend UI. It is a **backend-only tool** that runs either as a CLI command or an HTTP API. This manual documents how to use it from the command line and API, and how it interacts with the data visible in other frontend modules.

---

## 2. Overview

The Seed service imports reference data (products, categories, UOMs, test definitions, questionnaires, etc.) from multiple sources into the databases of all backend services. After seeding, the data appears in the corresponding frontend pages.

### What Gets Seeded

| Target Backend | Frontend Pages Affected | Example Data |
|---|---|---|
| **rxsoft** (backend) | Products, Categories, Manufacturers, UOMs, Warehouses, Customers, Payment Methods, GL Accounts, Journals | Product catalog, chart of accounts |
| **lis** (LIMS) | Test Definitions, Test Categories, Panels, LOINC, Methods, Sample Types, UOMs, Priorities | Laboratory test catalog |
| **identity** | Users, Roles, Organizations, Locations, Permissions | Admin accounts, role assignments |
| **conversation** | Questionnaires, Questions, Option Lists, Workflows, Channels | Patient engagement templates |
| **interop** | Application Entities, Mappings, Routing Rules | Integration configuration |

---

## 3. Using the CLI

### Run All Seeds

```bash
cd seed
npm run seed
```

This boots the app context, imports all configured entities across all targets, and exits.

### Output

The CLI prints a per-entity summary:

```
[SEED] Starting import for target: backend
[SEED]   entity: items         → processed: 150  success: 150  failed: 0
[SEED]   entity: categories    → processed: 25   success: 25   failed: 0
[SEED]   entity: manufacturers → processed: 40   success: 40   failed: 0
[SEED] Starting import for target: lis
[SEED]   entity: test_definitions → processed: 80  success: 80  failed: 0
[SEED] Starting import for target: identity
[SEED]   entity: users  → processed: 5  success: 5  failed: 0
[SEED]   entity: roles  → processed: 8  success: 8  failed: 0
[SEED] Import complete.
```

### When to Run

- **First setup** — After creating the databases, run `npm run seed` to populate initial data
- **After adding new seed data** — When you add CSV/JSON/Google Sheets data under `seeds/`
- **After config changes** — When you modify `import-config.ts`
- **Staging refresh** — Before deploying to staging, re-seed to ensure consistency

---

## 4. Using the HTTP API

### Start the Service

```bash
npm run start:dev    # Dev mode on port 8093
# or
npm run build && npm start    # Production mode
```

### Endpoints

#### Run All Imports

```bash
curl -X POST http://localhost:8093/api/imports \
  -H "x-api-key: YOUR_SEED_API_KEY"
```

#### Run a Specific Target

```bash
curl -X POST http://localhost:8093/api/imports \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_SEED_API_KEY" \
  -d '{"target": "backend"}'
```

Available targets: `backend`, `lis`, `identity`, `concepts`, `conversation`, `interop`

#### Run a Single Entity

```bash
curl -X POST http://localhost:8093/api/imports/backend.items \
  -H "x-api-key: YOUR_SEED_API_KEY"
```

#### Health Check

```bash
curl http://localhost:8093/api/imports/health
```

### Response Format

```json
{
  "status": "ok",
  "results": [
    {
      "target": "backend",
      "entity": "items",
      "processed": 150,
      "success": 150,
      "failed": 0,
      "errors": []
    }
  ]
}
```

---

## 5. Auto-Seed on Startup

To automatically import all data when the service boots:

```bash
# In .env
SEED_ON_START=true
```

This is useful for:
- Container orchestration (Kubernetes, Docker Compose)
- CI/CD pipelines
- Development environment setup

---

## 6. Source Types

### Google Sheets (Recommended for Shared Data)

Each target has a Google Spreadsheet with tabs named after entities:

```
Spreadsheet: "RxSoft Backend Seeds"
  Tab: "items"        → seeds/backend/items table
  Tab: "categories"   → seeds/backend/categories table
  Tab: "uoms"         → seeds/backend/uoms table
```

Credentials live in `seeds/<target>/googlesheets/config/`:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `SPREADSHEET_ID`

### CSV (For Bulk Data)

Place CSV files under `seeds/<target>/csv/`:

```
seeds/backend/csv/items.csv
seeds/lis/csv/test_definitions.csv
```

Column headers must match DB column names.

### JSON (For Structured Data)

Place JSON files under `seeds/<target>/json/`:

```json
[
  { "code": "AMX-500", "name": "Amoxicillin 500mg", "category_code": "ANTIBIOTICS" },
  { "code": "PAR-500", "name": "Paracetamol 500mg", "category_code": "ANALGESICS" }
]
```

### Inline (For Fallback Data)

Place JSON files under `seeds/<target>/inline/`:

Same format as JSON, but used as fallback when other sources don't have the data.

---

## 7. Data Flow: Seed → Frontend

Here's how seeded data appears in the frontend:

```
1. Seed data written to DB
   └→ e.g., items table in PostgreSQL

2. RxSoft Backend serves GET /api/catalog
   └→ Returns items from PostgreSQL

3. Frontend Products page calls /api/catalog
   └→ Displays in the products list

4. User sees seeded products with correct names, codes, prices
```

### Verification

After seeding, verify data appears in the frontend:

1. **Products** → `/rxsoft/products` — Should show seeded items
2. **Categories** → `/rxsoft/categories` — Should show seeded categories
3. **Test Definitions** → `/lis/test-definitions` — Should show seeded tests
4. **Users** → `/rxsoft/users` — Should show seeded user accounts
5. **Questionnaires** → `/conversation/questionnaires` — Should show seeded questionnaires

---

## 8. Adding New Seed Data (Step by Step)

### Example: Add a new product category

1. **Add data to source:**
   ```
   seeds/backend/inline/categories.json
   ```
   ```json
   [
     { "code": "SUPPLEMENTS", "name": "Supplements & Vitamins", "description": "Nutritional supplements" }
   ]
   ```

2. **Ensure config exists** in `src/config/import-config.ts`:
   ```typescript
   {
     target: 'backend',
     entity: 'categories',
     conflictKeys: ['code'],
     importOrder: 1,
   }
   ```

3. **Run seed:**
   ```bash
   npm run seed
   ```

4. **Verify in frontend:**
   - Navigate to `/rxsoft/categories`
   - The new "Supplements & Vitamins" category should appear

---

## 9. Idempotency & Safety

### What "Idempotent" Means

Re-running the seed is safe:
- **Existing rows** are updated (upserted by conflict keys)
- **New rows** are inserted
- **No duplicates** are created
- **No data is lost**

### Conflict Keys

Each entity has `conflictKeys` — columns that uniquely identify a row:
- `uuid` — UUID primary key
- `code` — Business code (e.g., product code, category code)

### Full Sync Mode

Some entities use `syncMode: 'full_sync'`:
- Rows in the source are upserted
- Rows **not** in the source are **soft-deleted** (`deleted_at` set, `is_active=false`)
- This keeps the DB in sync with the source of truth

---

## 10. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SEED_PORT` | 8093 | HTTP port |
| `SEED_SOURCE` | inline | Source type: `google`, `csv`, `json`, `inline`, `all` |
| `SEED_ON_START` | false | Auto-import on startup |
| `SEED_API_KEY` | *(empty)* | API key for HTTP endpoints |
| `SEED_DB_BACKEND_URL` | — | PostgreSQL for rxsoft |
| `SEED_DB_LIS_URL` | — | PostgreSQL for LIMS |
| `SEED_DB_IDENTITY_URL` | — | PostgreSQL for identity |
| `SEED_DB_CONCEPTS_URL` | — | PostgreSQL for concepts |

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| Entity not seeding | Check `import-config.ts` has the entity registered |
| Target skipped | Add `SEED_DB_<TARGET>_URL` to `.env` |
| Relation errors | Ensure parent entities are imported first (check `importOrder`) |
| Google auth fails | Verify credentials in `seeds/<target>/googlesheets/config/` |
| Data not in frontend | Ensure the corresponding backend is running and the frontend is calling the right API |
| Duplicate rows | Check `conflictKeys` match your DB unique constraints |

---

## 12. Related Documentation

- [MANUAL.seed.md](./MANUAL.seed.md) — Backend API reference
- [IMPORT_ARCHITECTURE.md](../IMPORT_ARCHITECTURE.md) — Full architecture and porting guide
- [PRD.md](./PRD.md) — Full product requirements
