# Damorex Online Pharmacy Platform
## Software Requirements Specification (SRS)

---

## Project Information

| Item | Details |
|---|---|
| **Project Name** | Damorex Online Pharmacy Platform |
| **Domain** | damorex.com |
| **Business Type** | Community Pharmacy & Healthcare Commerce Platform |
| **Location** | Nigeria |
| **Prepared For** | Damorex |
| **Platform Type** | Multi-branch Pharmacy Ecommerce & Healthcare Platform |

---

# 1. Executive Summary

The system must support:

- Online medicine ordering
- Prescription uploads
- Same-day delivery
- Multi-branch inventory management
- Product categorization by therapeutic use and drug classifications
- Shop by health concerns
- Health consultations
- Subscription/refill systems
- Loyalty systems
- AI-ready architecture for future expansion

---

# 2. Business Objectives

## Primary Objectives

- Launch a full-featured online pharmacy platform within 4 weeks
- Achieve at least 10 online orders daily within 6 months
- Digitize Damorex pharmacy operations
- Enable 24/7 online pharmaceutical ordering
- Expand Damorex into a scalable healthcare commerce platform

## Secondary Objectives

- Improve customer convenience
- Enable home delivery
- Increase customer retention
- Create refill automation
- Build future-ready healthcare infrastructure

---

# 3. Business Information

| Item | Details |
|---|---|
| **Business Name** | Damorex |
| **Industry** | Community Pharmacy |
| **Country** | Nigeria |
| **Branch Structure** | Multiple Branches |
| **Domain** | damorex.com |
| **Social Media** | @damorex |
| **Brand Color** | Green |
| **Operating Hours** | 24 Hours |
| **Delivery Locations** | Lagos, Ogun State, Oyo State |
| **Delivery Policy** | Free delivery above ₦10,000 |

---

# 4. Branding Requirements

## Brand Direction

The platform should appear:

- Modern
- Friendly
- Community-focused
- Trustworthy
- Professional
- Healthcare-oriented

## Logo Requirements

- Incorporate “Rx” into the logo identity
- Use green as primary color
- Modern typography
- Minimal healthcare-inspired iconography
- International/generic pharmacy aesthetic

## Design Inspiration

Reference websites:

- Green Pharmacy Online
- My Apple Rx
- Makeup Store Brand Example

---

# 5. Platform Scope

The platform shall include:

## Core Modules

- Pharmacy Ecommerce
- Prescription Management
- Multi-Branch Inventory
- Delivery Management
- Consultation System
- User Dashboard
- Admin Dashboard
- Notification System
- Loyalty & Rewards
- Refill Subscription System
- AI-ready Chat Infrastructure
- Blog & SEO System

---

# 6. Product Categories

## Pharmacy Products

- Prescription Medicines
- OTC Medicines
- Supplements
- Psychotherapeutic Drugs
- Therapeutic Medicines
- Supermarket Products

## Product Classification

Products shall support categorization page listing as search by:

- Therapeutic Use
- Drug Class
- Access & Availability
- Brand Name
- Generic Name
- Active Ingredients
- Unit of Dispense
- Dosage Form
- Strength
- Pack Size
- Add a whatsapp chat link to make users directly order on whatsapp

---

# 7. Functional Requirements

## 7.1 Ecommerce System

### Features

- Product browsing
- Advanced filtering
- Search functionality
- Product categories
- Cart management
- Checkout system
- Online payment
- Cash on delivery
- Order management
- Delivery tracking
- Order history
- Reordering system

---

## 7.2 Product Detail Page

Each product shall include:

- Product name
- Generic name
- Brand name
- Product images
- Description
- Active ingredients
- Therapeutic use
- Drug classification
- Unit of dispense
- Dosage information
- Manufacturer
- Availability status
- Price
- Delivery estimate
- Prescription requirement
- Related products

---

## 7.3 Smart Search System

The system shall support:

- Generic drug search
- Brand name search
- Therapeutic category search
- Symptom-based search
- Drug classification search
- Typo tolerance
- Predictive suggestions
- Auto-complete

---

## 7.4 Prescription Management

### Features

- Prescription image upload
- PDF upload
- Prescription validation
- Pharmacist review
- Prescription history
- Refill requests
- Approval workflow before dispatch

### Supported File Types

- JPG
- PNG
- PDF

---

## 7.5 User Accounts

Users shall be able to:

- Register/login
- Save addresses
- Manage prescriptions
- View order history
- Reorder medications
- Track deliveries
- Manage subscriptions
- Earn loyalty points
- Receive refill reminders

---

## 7.6 Multi-Branch Management

The platform shall support:

- Multiple pharmacy branches
- Branch-specific inventory
- Branch-specific order fulfillment
- Inventory synchronization
- Branch order routing
- Centralized administration

---

## 7.7 Delivery System

### Features

- Same-day delivery
- Delivery scheduling
- Delivery fee calculation
- Delivery zone management
- Order tracking
- Delivery notifications

### Delivery Coverage

- Lagos
- Ogun State
- Oyo State

---

## 7.8 Consultation System

The platform shall support:

- Pharmacist consultations
- Appointment booking
- Live chat
- WhatsApp ordering
- AI chatbot integration (future phase)

---

## 7.9 Notification System

Notifications shall support:

- SMS
- Email
- WhatsApp

### Notification Events

- Order confirmation
- Payment confirmation
- Dispatch updates
- Delivery updates
- Prescription reminders
- Refill reminders
- Promotional campaigns

---

## 7.10 Loyalty & Rewards

The platform shall support:

- Loyalty points
- Referral system
- Promo codes
- Reward redemption

---

## 7.11 Subscription & Refill System

Users shall be able to:

- Subscribe to recurring medications
- Receive refill reminders
- Enable recurring orders
- Manage subscriptions

---

# 8. Admin System Requirements

## 8.1 Admin Roles

### Super Admin

- Full platform access

### Branch Manager

- Manage branch inventory/orders

### Pharmacist

- Review prescriptions
- Manage consultations

### Dispatch Staff

- Manage deliveries

### Customer Support

- Handle customer inquiries

---

## 8.2 Admin Features

- Dashboard analytics
- Product management
- Inventory management
- Order management
- Prescription approval
- Customer management
- Delivery management
- Reporting system
- Notification management
- Blog management
- Promotional management

---

# 9. Inventory Integration

The system shall integrate with existing in-store pharmacy software.

## Required Integration Features

- Inventory synchronization
- Product synchronization
- Price synchronization
- Order synchronization
- Stock updates

## Possible Integration Methods

- API integration
- Database synchronization
- CSV import/export

---

# 10. Technical Requirements

## Frontend

### Technology Stack

- React.js
- Vite
- Mantine 7 & Tailwind
- Redux Toolkit or Zustand
- Framer Motion

### Requirements

- Mobile-first design
- Progressive Web App (PWA)
- Responsive UI
- Fast performance
- SEO optimization

---

Backend
/Users/john/develop/rxsoft/rxsoft-backend

---

## Search Engine

- Meilisearch

### Future Option

- Elasticsearch

---

## Hosting & Infrastructure

### Requirements

- VPS Hosting
- Docker deployment
- CDN integration
- SSL security
- Cloud media storage

---

### Maps

- Google Maps API

---

# 11. SEO Requirements

The platform shall support:

- Technical SEO
- Product SEO
- Local SEO
- Blog SEO
- Schema markup
- Sitemap generation
- Meta management

## SEO Target Keywords

Examples:

- Buy drugs online Lagos
- Buy drugs online Ibadan
- Buy drugs online Apata
- 24-hour pharmacy Nigeria
- Pharmacy near me
- Online pharmacy Nigeria

---

# 12. Content Requirements

Damorex currently possesses:

- Medicine database
- Drug categories
- Drug classifications
- Written content

The platform shall additionally require:
-
- Generic pharmacy imagery
- Product images (use )
- Marketing banners
- SEO blog content

---

# 13. Blog & Educational System

The platform shall support:

- Health articles
- Drug education
- Wellness tips
- SEO blogging
- Health awareness campaigns

---

# 14. Mobile Application Readiness

The architecture shall support future:

- Android application
- iOS application
- React Native implementation

---

# 15. Future Expansion Requirements

Future scalability must support:

- Multiple branches
- Marketplace model
- Lab bookings
- Doctor network
- AI integrations
- Telemedicine
- Insurance integrations

---

# 18. Compliance Requirements

The platform must comply with:

- Nigerian pharmacy regulations
- Pharmaceutical sales regulations
- Online commerce regulations

## Compliance Features

- Prescription validation
- Order audit logs
- Medical disclaimers
- Terms & conditions
- Privacy policy


---

# 20. User Experience Requirements

The platform shall provide:

- Simple checkout flow
- Easy medicine discovery
- Mobile-first experience
- Fast search
- Easy prescription upload
- Accessible navigation
- Friendly UI

---


---

# 22. Recommended MVP Priorities

## Critical Features

- Home Page
- Ecommerce
- Product catalog
- Search system
- Prescription uploads
- Checkout
- Delivery system
- Multi-branch inventory
- User dashboard
- Admin dashboard
- Notifications

---

# 23. Success Metrics

## Initial Goals

- Minimum 10 daily orders
- Increased customer retention
- Improved delivery efficiency
- Reduced manual order handling

---

# 24. Conclusion

Damorex aims to become a leading digital community pharmacy platform in Nigeria by combining:

- Pharmacy commerce
- Healthcare accessibility
- Delivery convenience
- Prescription management
- Scalable healthcare technology

The proposed platform architecture supports both immediate launch requirements and long-term expansion into a comprehensive healthcare ecosystem.

Logo - /Users/john/develop/rxsoft/rxsoft-admin-3/src/features/damorex/sample_images/sample_logo.png
Sample website list - /Users/john/develop/rxsoft/rxsoft-admin-3/src/features/damorex/sample_websites.list

Backend is in - /Users/john/develop/rxsoft/rxsoft-backend , add new APIs if necessary