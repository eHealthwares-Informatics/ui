# Changelog — frontend

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-10-25

### Added
- Sign-out dialog component with confirmation flow
- Team switcher component with improved UX and tests
- Social authentication integration (Google, Apple, etc.)
- Vite configuration updates for optimized builds

### Fixed
- Website navigation: use `menu.label` for `data-testid` (no key property on navMenus)
- Formatting issues across 52+ files (oxfmt)

### Testing
- Added tests for sign-out dialog
- Added tests for team switcher component
- E2E test improvements for website orders and payment flows

---

## [0cb7340] - 2026-10-25

### Fixed
- Website navigation test IDs: use `menu.label` for `data-testid`

---

## [a3a793b] - 2026-10-25

### Testing
- Added `data-testid` to interactive buttons on website (ui#68 §5)

---

## [0f82617] - 2026-10-24

### Added
- EMR annotate form fields: body-map, dermatome-map, organ-catalog components

---

## [178b815] - 2026-10-24

### Added
- Payment repair console with view, resend, status check, retry, complete actions
- Shop website flows (cart, checkout, orders, payments)
- EMR forms integration

---

## [9d95f2e] - 2026-10-23

### Added
- Payments: transaction repair console (view, resend, status check, retry, complete)

---

## [39a5c34] - 2026-10-23

### Added
- Website orders: show and edit customer contact on detail page

---

## [742d0b5] - 2026-10-23

### Testing
- Fixed UC-37 timeline regex to match arrow separator

---

## [1c2b908] - 2026-10-23

### Testing
- Increased modal close timeout to 30s in UC-01

---

## [40085f3] - 2026-10-23

### Fixed
- DebouncedTextInput: forward onChange to props for React Hook Form state updates

---

## [cf98926] - 2026-10-23

### Testing
- Use form-create testid for Create button in UC-01