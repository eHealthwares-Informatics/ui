# MANUAL — Seed Service

**Service:** `seed`
**Port:** 8093
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Seed service is a centralized data import tool for the entire RxSoft backend fleet. It reads seed data from multiple sources (Google Sheets, CSV, JSON, inline) and upserts it directly into each backend's database — no backend API calls required.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- PostgreSQL running (for backend/lis/identity/concepts targets)
- MongoDB running (for conversation target)
- Google Sheets credentials (optional, for `google` source)

### Install & Run

```bash
cd seed
npm install
cp .env.example .env    # fill in target DB URLs
npm run seed            # CLI run — imports everything, then exits
```

Or run as an HTTP service:
```bash
npm run start:dev       # dev server on port 8093
```

Swagger docs at **http://localhost:8093/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SEED_PORT` | 8093 | HTTP port for API endpoints |
| `SEED_SOURCE` | inline | Source type: `google`, `csv`, `json`, `inline`, `all` |
| `SEED_ON_START` | false | Import on startup |
| `SEED_LOG_LEVEL` | error,warn,log | Log levels: `all`, `none`, or comma-separated |
| `SEED_API_KEY` | *(empty)* | API key for `/api/imports` endpoints |
| `SEED_CSV_DIR` | seeds | Root dir for CSV files |
| `SEED_JSON_DIR` | seeds | Root dir for JSON files |
| `SEED_INLINE_DIR` | seeds | Root dir for inline JSON files |
| `SEED_GOOGLE_SHEET_<TARGET>` | — | Per-target Google spreadsheet ID |
| `GOOGLE_CLIENT_EMAIL` | — | Service account email (fallback) |
| `GOOGLE_PRIVATE_KEY` | — | Service account private key (fallback) |
| `SEED_DB_BACKEND_URL` | — | PostgreSQL connection for rxsoft |
| `SEED_DB_LIS_URL` | — | PostgreSQL connection for LIMS |
| `SEED_DB_IDENTITY_URL` | — | PostgreSQL connection for identity |
| `SEED_DB_CONCEPTS_URL` | — | PostgreSQL connection for concepts |

Targets without a `SEED_DB_*_URL` are skipped (reported, not failed).

---

## 4. Running Imports

### CLI Mode

```bash
npm run seed
```

Prints a per-entity summary (processed / success / failed) and any errors.

### HTTP API

```bash
# Import everything
curl -X POST http://localhost:8093/api/imports

# Import a specific target
curl -X POST http://localhost:8093/api/imports \
  -H "Content-Type: application/json" \
  -d '{"target": "backend"}'

# Import a single entity
curl -X POST http://localhost:8093/api/imports/backend.item

# Health check
curl http://localhost:8093/api/imports/health
```

All POST endpoints require `x-api-key` header when `SEED_API_KEY` is set.

### Auto-Seed on Boot

```bash
# Set in .env
SEED_ON_START=true
```

---

## 5. Source Types

### `inline`
Reads `seeds/<target>/inline/<entity>.json` — a bare JSON array of row objects.

### `csv`
Reads `seeds/<target>/csv/<entity>.csv` — column headers map to DB columns.

### `json`
Reads `seeds/<target>/json/<entity>.json` — bare array or object keyed by entity.

### `google`
Reads tabs from a Google Spreadsheet. Each tab name = entity name.
Credentials live in `seeds/<target>/googlesheets/config/`.

### `all`
Merges every source. Google wins (highest priority); deduplication by `uniqueKey`.

---

## 6. Data Layout

```
seeds/
  backend/
    inline/                  # <entity>.json fallback rows
    csv/                     # <entity>.csv
    json/                    # <entity>.json
    googlesheets/config/     # GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, SPREADSHEET_ID
  lis/
    inline/  csv/  json/  googlesheets/config/
  concepts/
    inline/  csv/  json/  googlesheets/config/
  identity/
    inline/  csv/  json/  googlesheets/config/
  conversation/
    inline/  csv/  json/  googlesheets/config/
  interop/
    inline/  csv/  json/  googlesheets/config/
```

---

## 7. Adding a New Entity

1. **Add data** to a source under `seeds/<target>/`:
   - inline: `seeds/<target>/inline/<entity>.json`
   - google: add a tab in the target's spreadsheet
   - csv/json: add `<entity>.csv` or `.json`

2. **Register config** in `src/config/import-config.ts`:
   ```typescript
   {
     target: 'backend',
     entity: 'items',
     relations: [{ codeColumn: 'category_code', fkColumn: 'category_id' }],
     importOrder: 2,
     conflictKeys: ['uuid'],
     organizationId: '...',
     syncMode: 'upsert',  // or 'full_sync'
   }
   ```

3. **Run and verify:**
   ```bash
   npm run seed
   ```

---

## 8. Behavior Details

### Idempotency
Re-running is safe. Rows are upserted by `conflictKeys` (`uuid`/`code`), never duplicated.

### Relation Resolution
Codes (e.g., `category_code`) are resolved to FK IDs through in-memory caches seeded from the DB.

### NOT_FOUND Handling
Unresolvable relation → child row points to a `NOT_FOUND` sentinel and is soft-deleted.

### Soft Delete
`full_sync` mode: rows missing from the source are soft-deleted (`deleted_at` set, `is_active=false`). Never hard-deleted.

### Organization Scoping
`organizationId` sets the org on each imported row and scopes `findAll()` queries.

---

## 9. Testing

```bash
npx jest           # Engine unit tests (in-memory, no DB)
npx tsc --noEmit   # Typecheck
npm run build      # Build
```

---

## 10. Troubleshooting

| Issue | Solution |
|---|---|
| Target skipped | Add `SEED_DB_<TARGET>_URL` to `.env` |
| Relation resolution fails | Ensure parent entity is imported first (check `importOrder`) |
| Google auth fails | Verify service account credentials in `googlesheets/config/` |
| Duplicate rows | Check `conflictKeys` match your DB unique constraints |
| API key rejected | Ensure `x-api-key` header matches `SEED_API_KEY` env var |

---

## 11. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [IMPORT_ARCHITECTURE.md](../IMPORT_ARCHITECTURE.md) — Full architecture and porting guide
- [AGENTS.md](../AGENTS.md) — Monorepo overview
