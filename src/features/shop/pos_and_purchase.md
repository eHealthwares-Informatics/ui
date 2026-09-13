# CLAUDE.md — RxSoft ERP Development Rules

## Mission

You are building a production-grade ERP platform similar to:

* Odoo
* ERPNext
* SAP Business One
* Oracle NetSuite

for:

* Pharmacy
* Hospital
* Retail
* Wholesale
* Multi-branch businesses

The goal is not to build CRUD screens.

The goal is to build complete business workflows.

---

# Core Principle

Always prioritize:

1. Business correctness
2. Accounting correctness
3. Inventory correctness
4. Workflow correctness
5. UX

Never sacrifice business rules for UI convenience.

---

# Before Writing Any Code

First understand:

* Business process
* State transitions
* Inventory effects
* Accounting effects
* Validation requirements

Before generating UI, identify:

* Inputs
* Outputs
* Side effects
* Status changes
* Inventory movements
* Financial impact

---

# Architecture Rules

## Preferred Stack

Frontend:

* React
* TypeScript
* Mantine v8
* Zustand
* React Query
* React Hook Form
* Zod

Backend:

* NestJS
* Prisma
* PostgreSQL

---

## State Management

### React Query

Use for:

* Products
* Customers
* Suppliers
* Warehouses
* Payments
* Purchases
* Sales
* Inventory

Never store server entities in Zustand.

---

### Zustand

Use only for:

* POS draft sessions
* UI settings
* Unsaved purchase drafts
* Temporary workflow state

---

# Component Rules

Never create giant pages.

Split into:

```text
feature/
├── components
├── hooks
├── api
├── store
├── types
├── utils
└── pages
```

Maximum page responsibility:

* orchestration
* layout
* routing

Business logic must not live inside page components.

---

# ERP Business Rules

## Inventory Is Sacred

Inventory can only change through:

```text
Purchase Receipt
Sale
Transfer
Adjustment
Manufacturing
Return
```

Never directly update stock quantities.

Always create inventory transactions.

---

## Inventory Transaction Types

```ts
IN
OUT
TRANSFER_IN
TRANSFER_OUT
ADJUSTMENT
RETURN_IN
RETURN_OUT
```

Every stock change must create a movement record.

---

# POS Rules

## Sessions

Support:

* Multiple sessions
* Hold sale
* Resume sale
* Duplicate sale
* Draft persistence

Each session is independent.

---

## Cart Rules

If product already exists:

```ts
quantity += enteredQuantity
```

Never duplicate lines.

---

## Pricing Rules

Support:

```text
Retail
Wholesale
Customer Price List
Promotional Pricing
Manual Override
```

Manual override requires permission.

---

## Discount Rules

Support:

### Line Discount

```ts
discountPercent
discountAmount
```

### Order Discount

```ts
discountPercent
discountAmount
```

Both can coexist.

---

## Tax Rules

Support:

```text
Tax Inclusive
Tax Exclusive
```

Calculate:

```ts
subtotal
discount
tax
grandTotal
```

in real time.

---

## Checkout Rules

Before checkout:

Validate:

* Stock
* Lot
* Expiry
* UOM
* Payment balance

Generate:

```ts
CreateSaleDto
```

exactly.

---

## Pharmacy Rules

Track:

```text
Batch Number
Lot Number
Expiry Date
Manufacture Date
```

Mandatory for controlled products.

---

## Expiry Rules

Warn:

```text
90 days
60 days
30 days
```

Block sale if configured.

---

## Controlled Products

Support:

```text
Prescription Required
Controlled Drug
Narcotic
```

Require validation before sale.

---

# Purchase Rules

Implement Odoo-style workflow.

---

## Purchase Status Flow

```text
Draft
↓
Approved
↓
Partially Received
↓
Received
```

Alternative:

```text
Draft
↓
Cancelled
```

---

## Draft

Can:

* edit supplier
* edit warehouse
* edit lines
* delete lines

---

## Approved

Can:

* receive stock

Cannot:

* change supplier
* delete lines

---

## Partially Received

Can:

* continue receiving

Cannot:

* reduce received quantity

---

## Received

Read only.

No modifications allowed.

---

## Cancelled

Read only.

No inventory movements allowed.

---

# Receiving Rules

Receiving stock must:

1. Update received quantity
2. Create inventory movement
3. Create lot/batch records
4. Update inventory valuation

Never update stock directly.

---

## Partial Receipt

Example:

```text
Ordered = 100
Received = 40
Remaining = 60
```

Multiple receipts allowed.

---

## Over Receipt

Disallow by default.

Allow only if configuration permits.

---

# Purchase Returns

Support:

```text
Return To Supplier
```

Rules:

Cannot return more than received.

Creates:

```text
Inventory OUT
Supplier Credit Note
Return Document
```

---

# Inventory Valuation

Support:

```text
FIFO
Average Cost
```

Never use:

```text
Last Purchase Price
```

unless explicitly configured.

---

# UI Rules

ERP first.

Not marketing website.

Prioritize:

```text
Data Density
Fast Keyboard Navigation
Efficiency
```

over decorative design.

---

## Tables

Must support:

* sorting
* filtering
* resizing
* pagination
* sticky headers
* column visibility

---

## Forms

Use:

```ts
react-hook-form
zod
```

Always.

Never use uncontrolled forms.

---

## Modals

Use for:

* payments
* receiving
* returns
* approvals

Do not create separate pages unless workflow requires it.

---

# Performance Rules

Must support:

* 10,000+ products
* 100+ concurrent POS sessions
* large purchase orders

Use:

* virtualization
* memoization
* query caching

where needed.

---

# Code Quality

Mandatory:

* strict TypeScript
* no any
* no duplicated business logic
* reusable hooks
* reusable calculations
* reusable DTO mappers

---

# Deliverable Expectations

When implementing a feature, generate:

1. Types
2. API layer
3. React Query hooks
4. Zustand store (if needed)
5. Components
6. Validation schema
7. Business rules
8. DTO mapping
9. Error handling
10. Loading states

Do not stop at UI generation.

A feature is only complete when the workflow works end-to-end.


You are a senior ERP architect, senior React/Mantine frontend engineer, senior NestJS backend engineer, and inventory/accounting domain expert.

## Context

We already have:

### Sales DTO

```ts
CreateSaleDto
CreateSaleLineDto
CreateSalePaymentDto
```

Sales support:

* POS sales
* Invoice sales
* Mobile sales
* Multiple payment methods
* Lot tracking
* UOM support

### Purchase DTO

```ts
CreatePurchaseDto
PurchaseLineDto
UpdatePurchaseDto
```

Purchase supports:

* Supplier
* Warehouse
* Branch
* Currency
* Purchase lines
* Ordered quantity
* Received quantity
* Discounts
* Taxes
* Partial receipt

Frontend stack:

* React
* TypeScript
* Mantine v8
* Zustand
* React Query
* React Hook Form
* Zod

Backend stack:

* NestJS
* PostgreSQL
* Prisma

---

# Objective

Implement a complete Odoo-inspired ERP workflow for:

1. POS Sales
2. Purchase Management (Inflow)
3. Inventory Movements
4. Receiving
5. Returns
6. Payments
7. Multi-session POS

Do not build toy examples.

Build production-grade ERP pages.

---

# POS REQUIREMENTS

## Multi Session POS

Support unlimited active sessions.

Each tab represents an independent draft sale.

```ts
interface PosSession {
  id: string;
  saleNumber: string;
  customerId?: string;
  cart: CartLine[];
  payments: PaymentDraft[];
  status: "draft";
}
```

Features:

* Add session
* Close session
* Duplicate session
* Hold session
* Resume session
* Persist sessions using Zustand persist
* Configurable tab position (top or bottom)

---

## Product Search

Support:

* Search by name
* Search by barcode
* Search by SKU
* Search by batch number

Debounced React Query search.

---

## Cart Rules

When product already exists:

Increase quantity.

Do not create duplicate lines.

---

## Inventory Validation

Before checkout:

Validate stock.

Rules:

* No negative stock unless warehouse allows it.
* Respect lot tracking.
* Respect expiry rules.
* Respect UOM conversions.

---

## Pricing

Support:

* Retail pricing
* Wholesale pricing
* Customer-specific pricing
* Manual override pricing (permission controlled)

---

## Discounts

Support:

* Line discount
* Order discount

Both percentage and fixed amount.

---

## Tax

Support:

* Tax inclusive
* Tax exclusive

Line level tax.

Order level totals.

---

## Payment Modal

Support:

* Cash
* Transfer
* POS Terminal
* Mobile Money
* Mixed Payments
* Credit Sales

Multiple payment lines.

Example:

```ts
payments: [
 {
   paymentMethodId: "cash",
   amount: 5000
 },
 {
   paymentMethodId: "transfer",
   amount: 3000
 }
]
```

---

## Checkout Flow

Generate:

```ts
CreateSaleDto
```

exactly matching backend DTO.

---

## Receipt

Support:

* Thermal receipt
* A4 invoice
* Reprint
* Email receipt

---

# PURCHASE MANAGEMENT (INFLOW)

Create a new page:

```text
PurchaseInflowPage
```

inspired by Odoo Purchase Orders.

---

## Header Section

Fields:

Supplier
Warehouse
Branch
PO Number
Invoice Number
Currency
Order Date
Expected Date
Status
Notes

Status flow:

```text
Draft
→ Approved
→ Partially Received
→ Fully Received
→ Cancelled
```

---

## Purchase Lines Grid

Columns:

Product
Description
UOM
Ordered Qty
Received Qty
Remaining Qty
Unit Cost
Discount %
Tax %
Subtotal

Rules:

```ts
remainingQty =
 orderedQty - receivedQty
```

Auto calculate totals.

---

## Odoo Purchase Rules

### Draft

Can edit everything.

### Approved

Cannot edit supplier.

Cannot delete lines.

Can receive stock.

### Partially Received

Can continue receiving.

Cannot reduce already received quantity.

### Received

Read only.

Inventory already posted.

### Cancelled

Read only.

No inventory movement.

---

## Receiving Workflow

Add:

```text
Receive Stock
```

button.

Opens modal.

Receive against individual lines.

Example:

Paracetamol
Ordered: 100
Received: 40

Receive:
20

````

Creates inventory movement.

---

## Inventory Movement Generation

On receive:

Create:

```ts
InventoryTransaction
````

Type:

```text
IN
```

Warehouse:

Selected warehouse.

Quantity:

Received quantity.

Unit Cost:

Purchase cost.

---

## Batch/Lot Management

For pharmacy products:

Require:

Batch Number
Manufacture Date
Expiry Date

before receiving.

Support multiple batches per line.

Example:

Paracetamol

Batch A:
50

Batch B:
50

````

---

## Costing Rules

Follow Odoo style valuation.

Support:

- FIFO
- Average Cost

Do not use last purchase price as inventory value unless explicitly configured.

---

## Purchase Returns

Create:

```text
Return To Supplier
````

workflow.

Rules:

Cannot return more than received quantity.

Creates:

```text
OUT inventory movement
Supplier Credit Note
```

---

## Purchase Totals

Calculate:

Subtotal
Discount Total
Tax Total
Grand Total

Real-time.

---

## React Architecture

Create:

```text
pages/
  PurchaseInflowPage.tsx

features/purchase/
  components/
    PurchaseHeader.tsx
    PurchaseLinesTable.tsx
    ReceiveStockModal.tsx
    PurchaseTotals.tsx
    PurchaseStatusBadge.tsx
    PurchaseActions.tsx
    PurchaseReturnModal.tsx

  hooks/
    usePurchaseCalculations.ts

  store/
    usePurchaseDraftStore.ts

  api/
    purchases.ts
```

---

# POS ARCHITECTURE

Create:

```text
features/pos/
  components/
    SaleTabs.tsx
    PosToolbar.tsx
    ProductEntryTable.tsx
    CartTable.tsx
    SalesSummary.tsx
    PaymentModal.tsx
    HeldSalesDrawer.tsx
    PosSettingsDrawer.tsx

  hooks/
    useBarcodeScanner.ts
    useKeyboardShortcuts.ts

  store/
    usePosStore.ts

  api/
    sales.ts
```

---

# CODE QUALITY

Requirements:

* Strict TypeScript
* No any
* React Query for server state
* Zustand for client state
* React Hook Form
* Zod validation
* Mantine v8
* Mobile responsive
* Keyboard shortcuts
* Loading states
* Error boundaries
* Optimistic updates where appropriate
* use /Users/john/develop/rxsoft/rxsoft-admin-3/src/features/components/form/async-field.tsx where appropriate for autocomplete

---

# DELIVERABLES

Generate:

1. Complete PurchaseInflowPage
2. Complete POS implementation
3. Zustand stores
4. React Query hooks
5. DTO mappers
6. API services
7. Receiving workflow
8. Purchase return workflow
9. Inventory movement integration
10. Receipt printing integration

Produce code that compiles and is organized into files, not a single giant file.


Backend modules are here (/Users/john/develop/rxsoft/rxsoft-backend/src/modules, especially purchases and sales)- Create any backend features not available after checking properly