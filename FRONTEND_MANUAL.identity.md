# FRONTEND MANUAL — Identity & Authentication

**Frontend routes:** `/sign-in`, `/sign-up`, `/forgot-password`, `/settings/*`
**Backend:** `rxsoft-identity` (port 8092)

---

## 1. What You Can Do

The Identity module in the frontend handles everything related to user accounts, authentication, roles, permissions, organizations, and personal settings. It is the entry point for all users of the RxSoft platform.

---

## 2. Getting Started

### Prerequisites
- Frontend dev server running (`yarn start:dev` in `frontend/`)
- Identity backend running on port 8092

### Navigation
The identity features are accessible from:
- **Top-right corner** → User avatar dropdown → Profile, Settings, Sign Out
- **Sidebar** → Admin section (for admin users) → Users, Roles, Organizations

---

## 3. Authentication

### Sign In

**Route:** `/sign-in`

1. Navigate to the sign-in page
2. Enter your **username** and **password**
3. Click **Sign In**
4. You are redirected to the dashboard

The sign-in page features:
- Username/email field
- Password field with show/hide toggle
- "Forgot password?" link
- "Create account" link (if self-registration is enabled)
- Auto-logout on token expiry (configurable)

### Sign Up

**Route:** `/sign-up`

If self-registration is enabled:
1. Fill in username, email, password, and confirm password
2. Click **Create Account**
3. You may be asked to verify your email via OTP

### Forgot Password

**Route:** `/forgot-password`

1. Enter your registered email address
2. Click **Send Reset Link**
3. Check your email for the reset token
4. Enter the token and set a new password

### Auto-Logout

The frontend includes an auto-logout feature that signs you out when your JWT token expires. You will see a notification before being redirected to the sign-in page.

---

## 4. User Management

**Route:** `/rxsoft/users`

The Users page provides a searchable, paginated list of all user accounts.

### Listing Users

| Feature | Description |
|---|---|
| **Search** | Type in the search bar to filter by name, email, or username |
| **Pagination** | Navigate through pages with the pagination controls |
| **Columns** | Username, email, organization, roles, status, last login |

### Creating a User

1. Click **Add User** button
2. Fill in the form:
   - **Username** (required)
   - **Email** (required)
   - **Password** (required)
   - **Organization** (select from dropdown)
   - **Location** (select from dropdown, scoped to organization)
   - **Roles** (multi-select from available roles)
3. Click **Create**

### Editing a User

1. Click the **⋮** (more actions) menu on a user row
2. Select **Edit**
3. Modify fields in the pre-filled form
4. Click **Save**

### Deleting a User

1. Click the **⋮** menu on a user row
2. Select **Delete**
3. Confirm the deletion in the dialog

---

## 5. Role Management

**Route:** `/rxsoft/roles`

Roles define what permissions a user has across the platform.

### Listing Roles

The roles list shows all defined roles with their descriptions and assigned permission counts.

### Creating a Role

1. Click **Add Role**
2. Enter **Role Name** (e.g., "Clinician", "Receptionist", "Pharmacist")
3. Enter **Description**
4. Select **Permission Codes** from the available list:
   - Permissions are grouped by module (patients, encounters, forms, catalog, sales, etc.)
   - Check the boxes for permissions this role should have
   - Use "Select All" for a module to grant all permissions in that module
5. Click **Create**

### Editing a Role

1. Click **⋮** → **Edit** on a role row
2. Modify name, description, or permissions
3. Click **Save**

### Understanding Permissions

Permissions follow the pattern `module.action`:
- `patients.read` — View patient records
- `patients.write` — Create and edit patients
- `encounters.write` — Record encounters
- `forms.submit` — Submit documentation
- `catalog.read` — View product catalog
- `sales.write` — Process sales
- `*` — Full access to everything (super admin only)

---

## 6. Organization Management

**Route:** `/rxsoft/organizations`

Organizations are the tenant boundaries in the multi-tenant architecture.

### Listing Organizations

Shows all registered organizations with their names, codes, and status.

### Creating an Organization

1. Click **Add Organization**
2. Fill in:
   - **Name** (required)
   - **Code** (unique identifier)
   - **Address**
   - **Phone**
   - **Email**
3. Click **Create**

### Editing an Organization

1. Click **⋮** → **Edit**
2. Modify fields
3. Click **Save**

---

## 7. Settings

**Route:** `/settings`

The Settings page is accessible from the top-right user avatar dropdown.

### Profile

**Tab:** Profile

Edit your personal information:
- **First Name**
- **Last Name**
- **Email**
- **Phone**
- **Avatar** (upload profile picture)

Click **Save Changes** to update.

### Account

**Tab:** Account

Manage your account security:
- **Change Password** — Enter current password, new password, and confirm
- **Two-Factor Authentication** — Enable/disable 2FA (if supported)

### Appearance

**Tab:** Appearance

Customize the look and feel:
- **Color Scheme** — Light / Dark / System default
- **Primary Color** — Choose your accent color
- **Layout** — Sidebar / Top navigation

### Notifications

**Tab:** Notifications

Configure notification preferences:
- **Email Notifications** — Toggle on/off
- **Push Notifications** — Toggle on/off
- **In-App Notifications** — Toggle on/off
- **Notification types** — Choose which events trigger notifications

---

## 8. Multi-Tenancy in the UI

The frontend respects tenant boundaries set by the identity service:

1. **Organization Selector** — If you belong to multiple organizations, you can switch between them using the org selector in the sidebar header
2. **Data Scoping** — All data shown is filtered to your current organization
3. **Global Admins** — Users with `organizationId: null` see all data across organizations
4. **Location Context** — Some features are scoped to your assigned location within the organization

---

## 9. Navigation Map

```
/sign-in                    → Sign in page
/sign-up                    → Registration page
/forgot-password            → Password reset page
/dashboard                  → Main dashboard (after login)
/settings                   → Personal settings
  /settings/profile         → Profile editor
  /settings/account         → Account security
  /settings/appearance      → Theme customization
  /settings/notifications   → Notification preferences
/rxsoft/users               → User management (admin)
/rxsoft/roles               → Role management (admin)
/rxsoft/organizations       → Organization management (admin)
```

---

## 10. Tips & Shortcuts

| Shortcut | Action |
|---|---|
| Click avatar → **Sign Out** | Log out and return to sign-in |
| Search bar on list pages | Instant filter as you type |
| **⋮** menu on table rows | Access edit/delete/actions |
| Breadcrumb links | Navigate back to parent pages |
| Tab switches | Switch between related views (e.g., patient profile tabs) |

---

## 11. Troubleshooting

| Issue | Solution |
|---|---|
| "Unauthorized" errors | Token may have expired — sign in again |
| Can't see a page | Check your role has the required permission codes |
| Organization data missing | Verify you're assigned to an organization |
| Settings not saving | Check network tab for API errors |
| Auto-logout too aggressive | The JWT access token TTL may be too short — contact admin |

---

## 12. Related Documentation

- [MANUAL.identity.md](./MANUAL.identity.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
