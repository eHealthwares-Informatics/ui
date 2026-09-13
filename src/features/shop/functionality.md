# PROJECT IMPLEMENTATION PROMPT

You are a Senior Full-Stack Architect, Senior React Developer, Senior NestJS Developer, UI/UX Designer, and Product Manager.

Your task is to transform the provided Damorex Pharmacy landing page into a complete enterprise-grade online pharmacy platform.

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Mantine UI
* React Router DOM
* TanStack Query
* Axios
* Zustand
* React Hook Form
* Zod
* Framer Motion

### Backend

* NestJS
* PostgreSQL
* Prisma ORM
* JWT Authentication
* Redis
* BullMQ
* AWS S3 (or compatible storage)

The backend already exists.

Any feature that does not currently exist should be implemented inside a new NestJS module named:

```bash
website
```

---

# BUSINESS OVERVIEW

Damorex is an Online Pharmacy Platform that allows users to:

* Search medicines
* Upload prescriptions
* Order medications
* Consult pharmacists
* Schedule deliveries
* Manage refills
* Track orders
* Earn loyalty rewards
* Read health articles
* Subscribe to newsletters

The platform serves customers across Nigeria.

---

# APPLICATION STRUCTURE

Create the following application architecture.

## Public Website

### Homepage

Convert the provided UI into a fully functional homepage.

Features:

* Hero Search
* Featured Medicines
* Categories
* Health Concerns
* Delivery Coverage
* Pharmacist Consultation CTA
* Testimonials
* Blog Preview
* Newsletter Subscription

API Endpoints:

```typescript
GET /website/homepage
```

Returns:

```typescript
{
  heroBanners: [],
  featuredProducts: [],
  categories: [],
  healthConcerns: [],
  testimonials: [],
  articles: []
}
```

---

# SHOP MODULE

Create a complete medicine shopping experience.

## Pages

### /shop

Medicine catalog page.

Features:

* Search medicines
* Filters
* Sort products
* Pagination
* Categories
* Price range
* Availability filter
* Prescription filter

API:

```typescript
GET /website/products
```

Query:

```typescript
?page=1
&limit=20
&search=
&category=
&prescription=
```

---

### /shop/:slug

Medicine detail page.

Display:

* Product images
* Generic name
* Brand name
* Dosage
* Usage information
* Stock availability
* Price
* Reviews
* Related products

API:

```typescript
GET /website/products/:id
```

---

# CATEGORY PAGES

### /categories

Display all categories.

### /categories/:slug

Display category medicines.

Examples:

* Prescription Medicines
* OTC Medicines
* Supplements
* Wellness Products
* Medical Devices
* Baby Care
* Personal Care

API:

```typescript
GET /website/categories
GET /website/categories/:slug
```

---

# HEALTH CONCERNS

### /health-concerns

List all health concerns.

### /health-concerns/:slug

Display medications and educational content.

Examples:

* Diabetes
* Hypertension
* Malaria
* Respiratory Care
* Digestive Health
* Mental Wellness

API:

```typescript
GET /website/health-concerns
GET /website/health-concerns/:slug
```

---

# PRESCRIPTION MODULE

Create a complete prescription upload system.

## Pages

### /upload-prescription

Features:

* Upload image
* Upload PDF
* Camera upload
* Multiple files
* Notes

Accepted:

```typescript
jpg
jpeg
png
pdf
```

API:

```typescript
POST /website/prescriptions
```

Payload:

```typescript
FormData
```

Store files in S3.

Status:

```typescript
Pending
Under Review
Approved
Rejected
Fulfilled
```

---

### /my-prescriptions

Authenticated page.

Display:

* Uploaded files
* Status
* Pharmacist notes
* Medicines prescribed

API:

```typescript
GET /website/prescriptions
```

---

# PHARMACIST CONSULTATION MODULE

## Pages

### /consult-pharmacist

Features:

* Consultation form
* Symptoms
* Questions
* Preferred communication

Options:

* WhatsApp
* Phone
* Video Call

API:

```typescript
POST /website/consultations
```

---

### /consultations

Customer consultation history.

API:

```typescript
GET /website/consultations
```

---

# CART MODULE

Create shopping cart.

Pages:

### /cart

Features:

* Quantity adjustment
* Remove item
* Prescription validation
* Delivery estimate

API:

```typescript
POST /website/cart
GET /website/cart
DELETE /website/cart/:id
```

---

# CHECKOUT MODULE

### /checkout

Features:

* Delivery address
* Shipping method
* Payment method
* Order review

Supported Payments:

* Paystack
* Flutterwave
* Bank Transfer
* Cash on Delivery

API:

```typescript
POST /website/orders
```

---

# ORDER MANAGEMENT

### /orders

List customer orders.

### /orders/:id

Order details page.

Statuses:

```typescript
Pending
Confirmed
Processing
Dispatched
In Transit
Delivered
Cancelled
```

API:

```typescript
GET /website/orders
GET /website/orders/:id
```

---

# ORDER TRACKING

### /track-order/:trackingCode

Display:

* Current status
* Delivery timeline
* Estimated arrival

API:

```typescript
GET /website/orders/track/:trackingCode
```

---

# AUTHENTICATION

Create:

### /login

### /register

### /forgot-password

### /reset-password

Features:

* JWT Authentication
* OTP Verification
* Email Verification
* Phone Verification

---

# USER DASHBOARD

### /dashboard

Widgets:

* Active Orders
* Prescription Status
* Reward Points
* Consultations
* Saved Medicines

---

# REWARDS MODULE

### /rewards

Features:

* Loyalty points
* Referral rewards
* Coupons
* Discounts

API:

```typescript
GET /website/rewards
```

---

# BLOG MODULE

### /blog

List all articles.

### /blog/:slug

Article details page.

Features:

* Related articles
* SEO metadata
* Reading time

API:

```typescript
GET /website/articles
GET /website/articles/:slug
```

---

# DELIVERY COVERAGE MODULE

### /delivery-areas

Display:

* States
* Cities
* Delivery fees
* Estimated delivery times

API:

```typescript
GET /website/delivery-areas
```

---

# BRANCH MODULE

### /branches

Display pharmacy branches.

### /branches/:slug

Branch detail page.

Features:

* Address
* Opening hours
* Contact
* Available stock

API:

```typescript
GET /website/branches
GET /website/branches/:id
```

---

# CONTACT MODULE

### /contact

Features:

* Contact form
* Phone
* Email
* WhatsApp

API:

```typescript
POST /website/contact
```

---

# NEWSLETTER MODULE

### Subscription

API:

```typescript
POST /website/newsletter/subscribe
```

---

# SEARCH MODULE

Implement global search.

Search:

* Medicines
* Categories
* Articles
* Health concerns

API:

```typescript
GET /website/search
```

---

# CUSTOMER REVIEWS

### Product Reviews

API:

```typescript
POST /website/reviews
GET /website/reviews/:productId
```

Features:

* Ratings
* Photos
* Verified Purchase Badge

---

# ADMIN FEATURES

Create APIs for (if nnot currently available):

* Manage Products
* Manage Categories
* Manage Orders
* Manage Prescriptions
* Manage Articles
* Manage Testimonials
* Manage Consultations
* Manage Delivery Areas
* Manage Reward Programs

Use role-based access:

```typescript
Admin
Pharmacist
Customer
Delivery Agent
```

---

# WEBSITE MODULE (NESTJS)

Create:

```bash
src/modules/website
```

Structure:

```bash
website
├── controllers
├── services
├── repositories
├── dto
├── entities
├── guards
├── decorators
├── interfaces
├── events
├── queues
├── jobs
├── validators
├── website.module.ts
```

---

# FRONTEND STRUCTURE

```bash
/Users/john/develop/rxsoft/rxsoft-admin-3/src/features/damorex
├── pages
├── routes
├── layouts
├── modules
│   ├── home
│   ├── shop
│   ├── prescriptions
│   ├── consultations
│   ├── orders
│   ├── rewards
│   ├── blog
│   ├── auth
│   └── dashboard
├── components
│   ├── common
│   ├── forms
│   ├── product
│   ├── cart
│   ├── checkout
│   ├── pharmacist
│   └── layout
```

---

# UI REQUIREMENTS

Maintain the exact visual identity from the supplied design:

Colors:

```typescript
green = '#16A34A'
darkGreen = '#0F6F35'
blue = '#0EA5E9'
ink = '#0F172A'
muted = '#64748B'
```

Design Style:

* Premium Healthcare
* Modern Nigerian Pharmacy
* Clean White Spaces
* Soft Shadows
* Rounded Components
* Mobile First
* Accessibility Compliant

---

# SEO

Implement:

* Dynamic Meta Tags
* Open Graph
* Twitter Cards
* Structured Data
* Canonical URLs
* Sitemap
* Robots.txt

---

# PERFORMANCE

Requirements:

* Lazy Loading
* Route Splitting
* Image Optimization
* React Query Caching
* Pagination
* Infinite Scroll where appropriate

---

# DELIVERABLES

Generate:

1. Complete frontend architecture
2. Complete NestJS website module
4. API contracts
5. DTOs
6. Services
7. Controllers
8. Guards
9. Database models
10. React pages
11. Reusable components
12. Zustand stores
13. React Query hooks
14. Validation schemas
15. Authentication flows
16. Admin management interfaces
17. Testing strategy
18. Deployment strategy

All code must be production-ready, scalable, maintainable, strongly typed, and follow enterprise architecture standards.


Initial Page /Users/john/develop/rxsoft/rxsoft-admin-3/src/features/damorex/page.tsx
Backend is in /Users/john/develop/rxsoft/rxsoft-backend/src