# MANUAL — RxSoft Identity

**Service:** `rxsoft-identity`
**Port:** 8092
**Part of:** RxSoft monorepo

---

## 1. What This Service Does

The Identity service is the centralized authentication and authorization hub for the RxSoft platform. It manages users, roles, permissions, organizations, and locations — and issues the JWT tokens consumed by every other backend service.

---

## 2. Getting Started

### Prerequisites
- Node.js ≥22
- PostgreSQL running locally or via Docker

### Install & Run

```bash
cd identity
npm install
cp .env.example .env    # edit DB credentials if needed
npm run start:dev
```

The API starts on **http://localhost:8092**.
Swagger docs at **http://localhost:8092/docs**.

---

## 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8092 | Server port |
| `DB_TYPE` | postgres | Database type |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `DB_NAME` | identity | Database name |
| `DB_SYNCHRONIZE` | true | Auto-create tables (dev) |
| `DB_DROP_SCHEMA` | true | Drop schema on start |
| `TYPEORM_LOGGING` | false | Query logging |
| `SEED_ON_START` | true | Seed on startup |
| `JWT_ACCESS_SECRET` | admin-access-secret | Access token signing secret |
| `JWT_REFRESH_SECRET` | admin-refresh-secret | Refresh token signing secret |
| `INTERNAL_API_KEY` | rxsoft-internal-key | Service-to-service auth |

---

## 4. API Reference

### 4.1 Authentication

#### Login
```bash
POST /auth/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "roles": ["super_admin"],
    "permissions": ["*"]
  }
}
```

#### Refresh Token
```bash
POST /auth/refresh-token
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer <accessToken>
```

### 4.2 Users

| Operation | Method | Endpoint |
|---|---|---|
| Create user | `POST` | `/users` |
| List users | `GET` | `/users?page=&limit=&search=` |
| Get user by ID | `GET` | `/users/:id` |
| Update user | `PATCH` | `/users/:id` |
| Delete user | `DELETE` | `/users/:id` |

**Create user:**
```json
{
  "username": "dr_smith",
  "email": "smith@hospital.com",
  "password": "secure123",
  "organizationId": "...",
  "locationId": "...",
  "roleIds": ["..."]
}
```

### 4.3 Roles

| Operation | Method | Endpoint |
|---|---|---|
| Create role | `POST` | `/roles` |
| List roles | `GET` | `/roles` |
| Get role by ID | `GET` | `/roles/:id` |
| Update role | `PATCH` | `/roles/:id` |
| Delete role | `DELETE` | `/roles/:id` |

**Create role:**
```json
{
  "name": "Clinician",
  "description": "Clinical staff with access to patient records",
  "permissionCodes": ["patients.read", "encounters.write", "forms.submit"]
}
```

### 4.4 Permissions

```bash
GET /permissions/modules
```

Returns all available permissions grouped by module (e.g., `patients`, `encounters`, `forms`, `catalog`).

### 4.5 Organizations

| Operation | Method | Endpoint |
|---|---|---|
| Create organization | `POST` | `/organizations` |
| List organizations | `GET` | `/organizations` |
| Get organization by ID | `GET` | `/organizations/:id` |
| Update organization | `PATCH` | `/organizations/:id` |
| Delete organization | `DELETE` | `/organizations/:id` |

### 4.6 Locations

| Operation | Method | Endpoint |
|---|---|---|
| Create location | `POST` | `/locations` |
| List locations | `GET` | `/locations?organizationId=` |
| Get location by ID | `GET` | `/locations/:id` |
| Update location | `PATCH` | `/locations/:id` |
| Delete location | `DELETE` | `/locations/:id` |

---

## 5. JWT Token Payload

Every token issued by the identity service includes:

```typescript
{
  sub: string;                   // user UUID
  organizationId: string | null; // null = global admin
  locationId: string | null;     // user's assigned location
  username: string;
  roles: string[];
  permissions: string[];
}
```

Other backends extract this payload and apply tenant scoping via `TenantContext`:

```typescript
const tenant = tenantFromUser(currentUser);
// Normal user: WHERE org_id = X OR org_id IS NULL
// Global admin (org_id === null): no filter
```

---

## 6. Architecture

- **Clean architecture:** Port/adapter pattern with repository interfaces + TypeORM implementations
- **Use cases:** Single-responsibility classes (e.g., `CreateUserUseCase`, `LoginUseCase`)
- **String-based relations:** TypeORM entities use strings (`@ManyToMany('RoleOrmEntity')`) to avoid circular dependencies

---

## 7. Database

- **Type:** PostgreSQL (same instance as rxsoft-backend)
- **Database name:** `identity` (configurable via `DB_NAME`)
- **Schema management:** Auto-syncs in dev (`synchronize: true`); use migrations for production

---

## 8. Multi-Tenancy

The identity service is the source of truth for tenant boundaries:

1. **Organizations** define tenant boundaries
2. **Locations** are scoped to organizations
3. **Users** are assigned to an organization and location
4. **Global admins** have `organizationId: null` and see all data

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
| Login fails | Verify username/password; check if `SEED_ON_START` created default users |
| JWT validation fails in other services | Ensure `JWT_ACCESS_SECRET` matches across all services |
| Tables not created | Check `DB_SYNCHRONIZE=true` or run migrations |
| Service-to-service 403 | Verify `INTERNAL_API_KEY` matches across services |

---

## 11. Related Documentation

- [PRD.md](./PRD.md) — Full product requirements
- [AGENTS.md](./AGENTS.md) — Detailed identity service documentation
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [AGENTS.md](../AGENTS.md) — Monorepo overview
