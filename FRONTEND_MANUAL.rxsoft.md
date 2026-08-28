# FRONTEND MANUAL — RxSoft Backend (Pharmacy & Retail)

**Frontend routes:** `/rxsoft/*`
**Backend:** `rxsoft-backend` (port 8080)

---

## 1. What You Can Do

The RxSoft module is the largest frontend section, covering pharmacy operations, retail healthcare, inventory management, financial accounting, and website content management. It provides full CRUD, search, filtering, sorting, metrics dashboards, and CSV export for 40+ entity types.

---

## 2. Navigation

All RxSoft pages are accessible from the **sidebar** under the RxSoft section. The sidebar groups pages by domain:

```
Sidebar → RxSoft
  ├── Dashboard
  ├── Catalog & Inventory
  │   ├── Products
  │   ├── Categories
  │   ├── Manufacturers
  │   ├── UOMs (Units of Measure)
  │   ├── UOM Categories
  │   ├── Drug Components
  │   ├── Pharmaceutics
  │   ├── Inventory
  │   ├── Stock Locations
  │   └── Warehouses
  ├── Sales & Purchases
  │   ├── Sales
  │   ├── Sales Lines
  │   ├── Sales Analytics
  │   ├── Purchases
  │   ├── Receiving
  │   ├── Purchases Analytics
  │   └── Suppliers
  ├── Customers & Pricing
  │   ├── Customers
  │   ├── Price Lists
  │   ├── Price List Items
  │   └── Insurance Providers
  ├── Financial
  │   ├── GL Accounts
  │   ├── Journals
  │   ├── Journal Entries
  │   ├── Journal Entry Lines
  │   ├── Trial Balance
  │   ├── Balance Sheet
  │   ├── Income Statement
  │   └── Receivables
  ├── POS & Payments
  │   ├── POS Terminals
  │   ├── Payment Methods
  │   └── Payment Providers
  ├── Administration
  │   ├── Users
  │   ├── Roles
  │   ├── Organizations
  │   ├── Branches
  │   └── Audit Logs
  ├── Website (eHealthwares)
  │   ├── Articles
  │   ├── Hero Slides
  │   ├── Products
  │   ├── Services
  │   ├── Testimonials
  │   ├── Categories
  │   ├── Team
  │   ├── Partners
  │   ├── Careers
  │   ├── Investors
  │   ├── Contact Submissions
  │   └── Settings
  ├── Communication
  │   └── Conversation
  └── Reports
```

---

## 3. Common UI Patterns

Every RxSoft list page follows a consistent pattern:

### List View
- **Search bar** — Instant filter as you type (minimum 2 characters)
- **Column headers** — Click to sort ascending/descending
- **Column filters** — Click the filter icon on column headers for:
  - Text search
  - Date range picker
  - Number range
  - Dropdown selection (for enum/relation fields)
- **Pagination** — Page controls at the bottom
- **Metrics cards** — Summary stats at the top (on pages with `metricsConfig`)
- **Export button** — Download CSV (on pages with `canExport: true`)

### Create / Edit Modal
- **Add button** — Opens a modal with the create form
- **Form fields** — Text, email, number, textarea, select, date, async-select (for relations)
- **Validation** — Required fields marked with asterisk
- **Payload builder** — Some forms transform data before sending (e.g., parsing JSON strings)

### Detail View
- **Detail modal** — Click a row to see full details
- **Edit action** — Edit directly from the detail modal
- **Delete action** — With confirmation dialog

---

## 4. Catalog & Inventory

### Products / Items

**Route:** `/rxsoft/products` (or `/rxsoft/items`)

The product catalog is the foundation of the pharmacy system.

**List columns:** Name, code, category, manufacturer, selling price, cost price, status

**Create fields:**
- Name (required)
- Code (required, unique)
- Category (async-select)
- Manufacturer (async-select)
- UOM (async-select)
- Selling Price
- Cost Price
- Reorder Level
- Description

**Metrics:** Total products, active count, low-stock alerts

### Categories

**Route:** `/rxsoft/categories`

Product classification hierarchy.

**Columns:** Name, code, parent category, description
**Create:** Name, code, parent (optional)

### Manufacturers

**Route:** `/rxsoft/manufacturers`

**Columns:** Name, code, contact, phone, email
**Create:** Name, code, contact info

### Drug Components

**Route:** `/rxsoft/drug-components`

Active pharmaceutical ingredients and their compositions.

**Columns:** Name, code, strength, form, manufacturer
**Create:** Name, code, strength, dosage form

### Pharmaceutics

**Route:** `/rxsoft/pharmaceutics`

Pharmaceutical formulations and compound definitions.

**Columns:** Name, code, type, components, status
**Create:** Name, code, type, component list

### UOMs (Units of Measure)

**Route:** `/rxsoft/uoms`

**Columns:** Name, code, UOM category
**Create:** Name, code, category (select)

### UOM Categories

**Route:** `/rxsoft/uom-category`

Groups of related units (e.g., "Weight" → kg, g, mg).

**Columns:** Name, code, description
**Create:** Name, code

---

## 5. Inventory Management

### Inventory

**Route:** `/rxsoft/inventory`

Two sub-views:

#### Stock Balances
Shows current stock levels per item per location.

**Columns:** Item name, Location, On Hand, Reserved, Available (computed: On Hand - Reserved)

**Filters:** Item search, Location search, quantity ranges

#### Stock Movements
Historical record of all stock changes.

**Columns:** Item, Location (from → to), Movement Type, Quantity, User, Date

**Movement types:** `in`, `out`, `transfer`, `adjustment`

**Filters:** Movement type dropdown, date range, item search

### Stock Locations

**Route:** `/rxsoft/stock-locations`

Physical locations where stock is stored (warehouses, shelves, bins).

**Columns:** Name, code, warehouse, address
**Create:** Name, code, warehouse (select)

### Warehouses

**Route:** `/rxsoft/warehouses`

**Columns:** Name, code, address, manager, status
**Create:** Name, code, address, manager

### Receiving

**Route:** `/rxsoft/receiving`

Purchase order receiving workflow. Shows pending and received shipments with a detail modal for line-item inspection.

**Columns:** PO number, supplier, status, received date, items count

---

## 6. Sales & Purchases

### Sales

**Route:** `/rxsoft/sales`

**Columns:** Sale #, Channel, Store, Total, Status, Date

**Create fields:**
- Sale Number (required)
- Sale Channel (e.g., "pos", "online")
- Store ID (required)
- Customer ID (optional)
- Lines (JSON textarea — array of `{ productId, uomId, quantity, unitPrice }`)
- Payments (JSON textarea — array of `{ paymentMethodId, amount }`)

**Metrics:** Total Sales, In Progress, Revenue, by Channel, by Category

**Export:** CSV download available

### Sales Lines

**Route:** `/rxsoft/sales-lines`

Individual line items within sales.

**Columns:** Sale, Product, Quantity, Unit Price, Line Total, Discount

### Sales Analytics

**Route:** `/rxsoft/sales-analytics`

Visual analytics dashboard for sales data with charts and summaries.

### Purchases

**Route:** `/rxsoft/purchases`

**Columns:** PO #, Supplier, Status, Total, Order Date, Expected Delivery

**Create:** PO number, supplier, line items, expected delivery date

### Purchases Analytics

**Route:** `/rxsoft/purchases-analytics`

Visual analytics dashboard for purchase data.

### Suppliers

**Route:** `/rxsoft/suppliers`

**Columns:** Name, code, contact, phone, email, address
**Create:** Name, code, contact info

---

## 7. Customers & Pricing

### Customers

**Route:** `/rxsoft/customers`

**Columns:** Name, Phone, Email, Address, Updated

**Create fields:**
- Name (required)
- Phone
- Email
- Address

**Export:** CSV download available

### Price Lists

**Route:** `/rxsoft/price-lists`

**Columns:** Name, code, currency, valid from, valid to, status
**Create:** Name, code, currency, date range

### Price List Items

**Route:** `/rxsoft/price-list-items`

Individual pricing entries within price lists.

**Columns:** Price list, Product, UOM, Unit Price, Min Qty, Discount %

### Insurance Providers

**Route:** `/rxsoft/insurance-providers`

**Columns:** Name, code, contact, phone, email
**Create:** Name, code, contact info

---

## 8. Financial Accounting

### GL Accounts (General Ledger)

**Route:** `/rxsoft/gl-accounts`

**Columns:** Code, Name, Type (Asset/Liability/Equity/Revenue/Expense), Balance
**Create:** Code, Name, Type, Parent account

### Journals

**Route:** `/rxsoft/journals`

**Columns:** Name, code, description, status
**Create:** Name, code, description

### Journal Entries

**Route:** `/rxsoft/journal-entries`

**Columns:** Entry #, Journal, Date, Description, Total Debit, Total Credit, Status
**Create:** Journal (select), Date, Description, Line items

### Journal Entry Lines

**Route:** `/rxsoft/journal-entry-lines`

Individual debit/credit lines within journal entries.

**Columns:** Entry, GL Account, Debit, Credit, Description

### Trial Balance

**Route:** `/rxsoft/trial-balance`

Read-only view showing all GL accounts with their debit/credit balances. Used for financial reconciliation.

### Balance Sheet

**Route:** `/rxsoft/balance-sheet`

Read-only financial statement showing assets, liabilities, and equity at a point in time.

### Income Statement

**Route:** `/rxsoft/income-statement`

Read-only financial statement showing revenue and expenses over a period.

### Receivables

**Route:** `/rxsoft/receivables`

**Columns:** Customer, Invoice #, Amount, Due Date, Status, Aging
**Create:** Customer, invoice details, due date

---

## 9. POS & Payments

### POS Terminals

**Route:** `/rxsoft/pos-terminals`

**Columns:** Name, code, store, status, last active
**Create:** Name, code, store (select)

### Payment Methods

**Route:** `/rxsoft/payment-methods`

**Columns:** Name, code, type (Cash/Card/Mobile/Bank), status
**Create:** Name, code, type

### Payment Providers

**Route:** `/rxsoft/payment-providers`

**Columns:** Name, code, type, API endpoint, status
**Create:** Name, code, type, configuration

---

## 10. Administration

### Users

**Route:** `/rxsoft/users`

User management with role and organization assignment. See [FRONTEND_MANUAL.identity.md](./FRONTEND_MANUAL.identity.md) for details.

### Roles

**Route:** `/rxsoft/roles`

Role management with permission code assignment. Includes a dedicated **Permissions** view.

### Organizations

**Route:** `/rxsoft/organizations`

Multi-tenant organization management.

### Branches

**Route:** `/rxsoft/branches`

Physical branch locations within organizations.

**Columns:** Name, code, organization, address, manager
**Create:** Name, code, organization, address

### Audit Logs

**Route:** `/rxsoft/audit-logs`

Read-only audit trail of all system actions.

**Columns:** Timestamp, User, Action, Entity, Entity ID, IP Address, Details

**Filters:** Date range, user, action type, entity type

---

## 11. Website Content (eHealthwares)

### Articles

**Route:** `/rxsoft/ehealthwares-articles` (or `/ehealthwares/articles`)

Blog posts and news articles for the website.

**Columns:** Title, author, category, status (draft/published), published date

### Hero Slides

**Route:** `/rxsoft/ehealthwares-hero-slides`

Homepage hero carousel slides.

**Columns:** Title, image, link, sort order, active

### Products (Website)

**Route:** `/rxsoft/ehealthwares-products`

Product showcase for the public website.

**Columns:** Name, category, image, description, featured, active

### Services

**Route:** `/rxsoft/ehealthwares-services`

Healthcare services offered.

**Columns:** Name, category, description, icon, active

### Testimonials

**Route:** `/rxsoft/ehealthwares-testimonials`

Customer testimonials and reviews.

**Columns:** Name, role, company, quote, rating, active

### Categories (Website)

**Route:** `/rxsoft/ehealthwares-categories`

Content categories for the website.

### Team

**Route:** `/rxsoft/ehealthwares-team`

Team member profiles.

**Columns:** Name, role, bio, photo, social links, sort order

### Partners

**Route:** `/rxsoft/ehealthwares-partners`

Partner organizations.

**Columns:** Name, logo, website, description, sort order

### Careers

**Route:** `/rxsoft/ehealthwares-careers`

Job listings.

**Columns:** Title, department, location, type (full-time/part-time), status

### Investors

**Route:** `/rxsoft/ehealthwares-investors`

Investor information page content.

### Contact Submissions

**Route:** `/rxsoft/ehealthwares-contact-submissions`

Inbound contact form submissions from the website.

**Columns:** Name, email, phone, subject, message, date, read status

### Website Settings

**Route:** `/rxsoft/ehealthwares-settings`

Global website configuration (SEO, contact info, social links).

---

## 12. Communication

### Conversation

**Route:** `/rxsoft/conversation`

Quick-access view for patient conversations (links to the full Conversation Engine UI).

---

## 13. Reports

**Route:** `/rxsoft/reports`

Reporting engine with various report types:
- Sales reports (daily, weekly, monthly)
- Inventory reports (stock levels, movements)
- Financial reports (revenue, expenses)
- Customer reports (top customers, aging)

---

## 14. Tips & Shortcuts

| Feature | How To |
|---|---|
| **Quick search** | Type in the search bar on any list page |
| **Column sort** | Click any column header |
| **Advanced filter** | Click the filter icon on column headers |
| **Export CSV** | Click the Export button (on supported pages) |
| **Create record** | Click the "Add" button at the top of any list |
| **Edit record** | Click a row → Edit in the detail modal |
| **Delete record** | Click a row → ⋮ menu → Delete |
| **Metrics** | Summary cards at the top of dashboard pages |
| **Pagination** | Use page controls at the bottom of lists |
| **JSON fields** | Some create forms accept JSON (e.g., sales lines) — paste valid JSON |

---

## 15. Troubleshooting

| Issue | Solution |
|---|---|
| "No data" on list pages | Check backend is running on port 8080 |
| Can't create record | Verify your role has write permissions for that module |
| Metrics not loading | Check the metrics endpoint is configured for that page |
| CSV export fails | Ensure the backend export endpoint is implemented |
| Sort not working | The backend uses a sort allow-list; new columns may need backend config |
| Two different form styles | Known debt — `ListQueryDto` vs `PaginationQueryDto` |

---

## 16. Related Documentation

- [MANUAL.rxsoft.md](./MANUAL.rxsoft.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search patterns
