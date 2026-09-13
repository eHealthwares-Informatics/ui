# frontend-design Skill

## Healthcare Ecommerce Design System (Damorex Edition)

### Purpose

This skill governs all frontend implementation for Damorex and future RxSoft-powered healthcare commerce platforms.

The objective is to produce production-quality interfaces that are:

* Trustworthy
* Healthcare-focused
* Conversion-oriented
* Mobile-first
* Accessible
* SEO-friendly
* Brand-consistent

The goal is not merely visual implementation but creating healthcare experiences that increase trust, prescription uploads, medicine discovery, consultations, and completed orders.

---

# Design Philosophy

Damorex is not a generic ecommerce website.

Users are making health-related decisions.

Every screen must communicate:

* Safety
* Professionalism
* Authenticity
* Convenience
* Human support

The UI should feel closer to:

* Modern healthcare providers
* Online pharmacies
* Healthtech platforms

Rather than:

* Fashion stores
* Electronics stores
* Generic SaaS dashboards

---

# Mandatory Workflow

## Step 1 — Analyze Context

Before creating any page:

Review:

* Brand assets
* Existing Damorex pages
* User requirements
* Healthcare compliance requirements
* Mobile experience

Identify:

* Primary user goal
* Trust indicators required
* Conversion goal

Examples:

### Homepage

Goal:

* Discover products
* Search medicines
* Upload prescription

### Product Page

Goal:

* Understand medicine
* Verify legitimacy
* Purchase safely

### Prescription Upload

Goal:

* Fast submission
* Clear guidance
* Regulatory compliance

---

## Step 2 — Brand Asset Inspection

Always inspect:

```txt
brand_assets/
```

Potential assets:

* Logo
* Color palette
* Typography
* Product photography
* Marketing creatives

Rules:

* Use provided assets first
* Never replace branding unnecessarily
* Preserve brand consistency
* Follow established visual language

---

# Damorex Visual Identity

## Primary Palette

Pharmacy Green

```css
#16A34A
```

Supporting Greens

```css
#22C55E
#15803D
#DCFCE7
```

Neutrals

```css
#FFFFFF
#F8FAFC
#E2E8F0
#64748B
#0F172A
```

Healthcare Accent

```css
#0EA5E9
```

Use sparingly.

---

# Typography

## Headings

Modern display font.

Preferred:

```txt
Manrope
Plus Jakarta Sans
Inter Tight
```

Characteristics:

* Strong
* Trustworthy
* Slightly condensed

Heading tracking:

```css
letter-spacing: -0.03em;
```

---

## Body

Preferred:

```txt
Inter
DM Sans
Source Sans Pro
```

Body line height:

```css
line-height: 1.7;
```

---

# Homepage Requirements

Every homepage should include:

## Trust Banner

Examples:

* Licensed Pharmacists
* Genuine Medicines
* Open 24 Hours
* Free Delivery Above ₦10,000

---

## Hero Section

Must contain:

* Medicine search
* Shop CTA
* Upload Prescription CTA
* WhatsApp CTA

The search bar is the primary action.

---

## Health Concern Categories

Examples:

* Diabetes
* Hypertension
* Malaria
* Family Care
* Vitamins
* Mental Wellness

---

## Product Discovery

Sections:

* Best Sellers
* Featured Products
* Popular Categories

---

## Prescription Upload

Must appear above the fold or shortly after hero.

This is a core pharmacy conversion funnel.

---

## Consultation CTA

Must include:

* Pharmacist consultation
* WhatsApp support

---

## Trust Section

Display:

* Licensed Pharmacists
* Genuine Medicines
* Same Day Delivery
* Secure Payments

---

# Component Standards

## Buttons

Every button requires:

### Default

Clear visual hierarchy.

### Hover

```css
transform: translateY(-2px);
```

### Focus

Visible focus ring.

### Active

Pressed state.

---

## Forms

Healthcare forms must prioritize:

* Simplicity
* Accessibility
* Error clarity

Always provide:

* Labels
* Helper text
* Validation feedback

---

## Product Cards

Must display:

* Product image
* Product name
* Generic name
* Price
* Availability
* Prescription requirement

Optional:

* Rating
* Delivery estimate

---

# Motion Rules

Allowed:

```css
transform
opacity
filter
```

Avoid:

```css
transition-all
```

Preferred:

```css
transition:
transform 220ms cubic-bezier(0.22,1,0.36,1),
opacity 220ms ease;
```

Motion should reinforce trust.

Never distract.

---

# Accessibility

Mandatory:

* WCAG AA
* Keyboard navigation
* Semantic HTML
* ARIA where needed
* Accessible forms
* Visible focus states

---

# Mobile First

Design priority:

```txt
Mobile
Tablet
Desktop
```

Target:

* 75%+ mobile traffic

Critical flows:

* Search medicine
* Upload prescription
* Add to cart
* Checkout
* WhatsApp order

Must be optimized for mobile first.

---

# Ecommerce Conversion Rules

Always prioritize:

1. Medicine Search
2. Prescription Upload
3. WhatsApp Ordering
4. Product Discovery
5. Checkout

Every page should make at least one of these actions obvious.

---

# Visual QA Checklist

Validate before completion:

### Brand

* Correct colors
* Correct logo
* Correct typography

### UX

* Clear hierarchy
* Clear CTAs
* Mobile optimized

### Healthcare

* Trust indicators present
* Compliance messaging present
* Prescription requirements clear

### Ecommerce

* Search visible
* Cart accessible
* Conversion paths obvious

### Accessibility

* Keyboard usable
* Contrast compliant
* Focus states visible

---

# Hard Rules

Never:

* Use generic SaaS layouts
* Hide medicine search
* Bury prescription uploads
* Overuse animations
* Use default Tailwind blue branding
* Create dark healthcare themes

Always:

* Build trust first
* Design mobile first
* Support medicine discovery
* Support prescription workflows
* Prioritize conversion
* Maintain healthcare professionalism

---

# Success Criteria

A completed design should make a first-time visitor immediately understand:

* What Damorex does
* How to search for medicines
* How to upload a prescription
* How to order via WhatsApp
* Why they should trust Damorex
* How delivery works

If these six questions are not answered within the first screen and scroll, the design is not complete.
