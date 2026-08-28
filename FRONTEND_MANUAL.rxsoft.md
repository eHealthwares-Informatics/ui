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

The sales list page shows all transactions with per-row actions and summary metrics.

**List columns:**
| Column | Description |
|---|---|
| Sale # | Unique sale number |
| Channel | Sale channel (pos, online, mobile) |
| Store | Store name (resolved from storeId) |
| Total | Total sale amount |
| Status | Draft, completed, voided |
| Date | Sale date |

**Metrics cards at top:**
- Total Sales (count)
- In Progress (count)
- Revenue (sum)
- Breakdown by Channel (e.g., "Channel: pos (42)")
- Breakdown by Category (top 5)

**Per-row actions:**
| Action | Description |
|---|---|
| **View Lines** (eye icon) | Navigate to `/rxsoft/sales-lines?saleId=...` to see individual line items |
| **Print Receipt** (printer icon) | Opens a PDF receipt in a new tab and triggers print |
| **Complete Sale** | Only for mobile channel + draft status — finalizes the sale and depletes stock |

**Create sale form:**
- **Sale Number** (required)
- **Sale Channel** (required) — e.g., `pos`, `online`, `mobile`
- **Store ID** (required)
- **Customer ID** (optional)
- **Lines** (required) — JSON textarea:
  ```json
  [{"productId":"...","uomId":"...","quantity":1,"unitPrice":10}]
  ```
- **Payments** (required) — JSON textarea:
  ```json
  [{"paymentMethodId":"...","amount":10}]
  ```

**Export:** CSV download via `/sales/export`

---

### Sales Lines

**Route:** `/rxsoft/sales-lines`

Individual line items within each sale. Filterable by `saleId` query param.

**Columns:** Sale, Product, Quantity, Unit Price, Line Total, Discount

**Filters:** Sale ID (from link), Product search, quantity range

---

### Sales Analytics

**Route:** `/rxsoft/sales-analytics`

Full-page analytics dashboard with interactive charts and KPIs.

**Filter bar:**
| Filter | Type | Description |
|---|---|
| Location | Dropdown | Filter by stock location/store |
| Date Range | Date picker | From / To dates (defaults to current month) |
| Category | Dropdown | Filter by product category |
| Payment Method | Dropdown | Filter by payment method |

**KPI cards (with period-over-period delta):**
- Total Revenue
- Total Sales (count)
- Average Sale Value
- Items Sold
- Gross Profit (with separate gross profit API)
- Return Rate

**Charts:**
- **Revenue Trend** — Line/area chart over time
- **Sales by Category** — Donut chart (top categories)
- **Sales by Channel** — Bar chart (pos, online, mobile)
- **Sales by Payment Method** — Donut chart
- **Sales by Location** — Bar chart
- **Top Products** — Ranked list
- **Status Distribution** — Donut chart (completed, draft, voided)

**Export:** "Export Report" button downloads a CSV of the filtered data

---

### Purchases

**Route:** `/rxsoft/purchases`

Full purchase order management with detail view, line item editing, and goods receiving workflow.

**List columns:**
| Column | Description |
|---|---|
| PO/Invoice | Purchase order or invoice number |
| Supplier | Supplier name (async-select filter) |
| Warehouse | Destination warehouse (async-select filter) |
| Currency | Currency code (e.g., NGN) |
| Total Cost | Total purchase value |
| Status | Draft, approved, partially_received, received, cancelled |
| Lines | Count of line items |

**Create purchase form:**
| Field | Type | Required |
|---|---|---|
| Supplier | async-select (searches `/customers`) | Yes |
| Warehouse | async-select (searches `/stock-locations`) | Yes |
| Product ID | text | Yes |
| Purchase UOM | async-select (searches `/uoms`) | No |
| Quantity | number | Yes |
| Unit Cost | number | Yes |
| Invoice/PO Number | text | No |
| Currency Code | text (placeholder: NGN) | No |
| Status | text (placeholder: draft) | No |
| Note | text | No |

**Detail view** (click a row → full detail modal):
- **Header fields:** PO Number, Supplier, Warehouse, Order Date, Expected Date, Status, Currency, Total Cost, Note
- **Purchase Lines accordion:** Expandable list of line items showing:
  - Item name — Ordered Qty, UOM @ Unit Cost = Line Total
  - **Inline edit** on each line (if status is not received/cancelled):
    - Unit Cost Price (number, min 0)
    - Received Qty (number, min 0)
  - Edit endpoint: `/purchases/:purchaseId/lines`

**Export:** CSV download via `/purchases/export`

---

### Receiving (Goods Receipt)

**Route:** `/rxsoft/receiving`

View and manage goods receipts from purchase orders.

**List columns:**
| Column | Description |
|---|---|
| Receipt # | Unique receipt number |
| PO # | Linked purchase order number |
| Date | Received date |
| Items | Count of received line items |
| Note | Receipt notes |

**Detail modal** (click a row):
- Header: Receipt number, PO number, date, note
- **Line items table:**
  | Column | Description |
  |---|---|
  | Item | Product name |
  | Ordered | Quantity ordered |
  | Received | Quantity received |
  | UOM | Unit of measure code |
  | Unit Cost | Cost per unit |
  | Status | Badge: Active (green) or Unposted (red) |
  | Action | **Unpost** button (orange, requires password confirmation) |

**Unpost workflow:**
1. Click **Unpost** on an active receipt line
2. Enter your password in the confirmation dialog
3. The line is reversed (status → Unposted)
4. Stock adjustments are automatically applied

---

### Purchases Analytics

**Route:** `/rxsoft/purchases-analytics`

Full-page analytics dashboard for purchasing performance.

**Filter bar:**
| Filter | Type | Description |
|---|---|
| Location | Dropdown | Filter by warehouse/location |
| Date Range | Date picker | From / To (defaults to current month) |
| Category | Dropdown | Filter by product category |
| Supplier | Dropdown | Filter by supplier |

**KPI cards (with period-over-period delta):**
- Total Purchase Value (₦ formatted)
- Total POs (count)
- Total Items Purchased
- Average PO Value
- Active Suppliers
- Top Supplier (name + value)

**Charts:**
- **Spend Trend** — Line chart over time
- **Spend by Category** — Donut chart
- **Spend by Supplier** — Bar chart (top 6)
- **Spend by Location** — Bar chart
- **Status Distribution** — Donut chart (Completed, Partially Received, Pending, Cancelled)
- **Top Suppliers Table** — Ranked list with spend amounts

**Export:** "Export Report" button downloads filtered data as CSV

---

### Suppliers

**Route:** `/rxsoft/suppliers`

**Columns:** Name, Code, Contact, Phone, Email, Address

**Create:** Name, Code, Contact person, Phone, Email, Address

**Used by:** Purchases (async-select in create form), Purchases Analytics (supplier filter)

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

Physical point-of-sale terminals assigned to the organization. Supports Nigerian payment providers.

**List columns:**
| Column | Description |
|---|---|
| Code | Unique terminal code |
| Label | Human-readable label |
| Provider | Payment provider type |
| Serial (SN) | Hardware serial number |
| Terminal ID | Provider-assigned terminal ID |
| Active | Whether the terminal is enabled |

**Create/edit form:**
| Field | Type | Required | Description |
|---|---|---|---|
| Code | text | Yes | Unique identifier |
| Label | text | No | Display name |
| Provider Type | select | Yes | Paystack, Monnify, OPay, Moniepoint |
| Serial (SN) | text | No | Physical serial number |
| Terminal ID | text | No | Provider terminal ID |
| Store ID | text | No | Store this terminal is assigned to |
| Active | switch | No | Default: on |

**Supported providers:** Paystack, Monnify, OPay, Moniepoint

---

### Payment Methods

**Route:** `/rxsoft/payment-methods`

Accepted payment instruments (what customers can use to pay).

**List columns:**
| Column | Description |
|---|---|
| Code | Unique method code |
| Name | Display name |
| Type | Payment method type |
| Active | Whether this method is accepted |

**Create/edit form:**
| Field | Type | Required |
|---|---|---|
| Code | text | Yes |
| Name | text | Yes |
| Method Type | select | Yes |
| Active | switch | No (default: on) |

**Method types:** Cash, Card, Transfer, Wallet, Insurance

**Usage:** Referenced when creating sales payments (the `paymentMethodId` in the payments JSON).

---

### Payment Providers

**Route:** `/rxsoft/payment-providers`

Gateway provider configurations with separate test and live credential storage.

**List columns:**
| Column | Description |
|---|---|
| Code | Unique provider code |
| Name | Display name |
| Provider | Provider type |
| Channel | Payment channel |
| Mode | **Live** or **Test** (based on `production` flag) |
| Active | Whether this provider is enabled |

**Create/edit form:**
| Field | Type | Required | Description |
|---|---|---|---|
| Code | text | Yes | Unique identifier |
| Name | text | Yes | Display name |
| Provider Type | select | Yes | Paystack, Monnify, OPay, Moniepoint, Wallet, Insurance, Cash |
| Channel | select | Yes | Cash, POS, Web, Wallet, Insurance |
| Description | text | No | What this provider is for |
| Use Live credentials | switch | No | Toggle between test and live mode |
| Active | switch | No | Default: on |
| Test Credentials (JSON) | JSON textarea | No | API keys, secrets for sandbox |
| Live Credentials (JSON) | JSON textarea | No | API keys, secrets for production |

**Provider types:** Paystack, Monnify, OPay, Moniepoint, Wallet, Insurance, Cash

**Channels:** Cash, POS, Web, Wallet, Insurance

**Credential security:** Test and live credentials are stored as JSON in the database. The `production` switch determines which credential set is active for processing.

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
| **Print receipt** | On Sales page, click the printer icon on any sale row |
| **Complete mobile sale** | On Sales page, click "Complete Sale" on mobile channel + draft status |
| **View sale lines** | Click the eye icon on a sale row to navigate to Sales Lines |
| **Edit PO lines** | In Purchase detail, expand the Lines accordion and click edit on any line |
| **Unpost receipt** | In Receiving detail, click Unpost on a line → enter password to confirm |
| **Switch live/test** | In Payment Providers, toggle "Use Live credentials" to switch modes |
| **Period comparison** | Analytics dashboards auto-compare to the previous period with delta percentages |
| **Export analytics** | Click "Export Report" on Sales/Purchases analytics for filtered CSV |

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
| POS terminal not processing | Check provider credentials in Payment Providers; verify terminal is Active |
| Sale receipt won't print | Ensure the backend PDF endpoint is implemented for that sale |
| Complete Sale button missing | Only appears for mobile channel + draft status |
| PO line edit blocked | Status must not be "received" or "cancelled" |
| Unpost requires password | Enter your account password in the confirmation dialog |
| Analytics charts empty | Check the date range filter; ensure data exists for the selected period |
| Payment provider mode wrong | Toggle "Use Live credentials" in Payment Providers config |

---

## 16. Related Documentation

- [MANUAL.rxsoft.md](./MANUAL.rxsoft.md) — Backend API reference
- [PRD.md](./PRD.md) — Full product requirements
- [BACKEND_SEARCH_ARCHITECTURE.md](../BACKEND_SEARCH_ARCHITECTURE.md) — List/search patterns
