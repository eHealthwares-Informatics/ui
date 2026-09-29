# Task: data-testid on all UI elements + testid-first e2e selectors

**Status**: Spec ready for implementation
**Priority**: High — blocks stable Phase 3+ specs
**Owner**: frontend + e2e
**Requested by**: John — *"i mentioned to always assign and use data-test-id to all elements for consistency"*

---

## 1. Why

Playwright phases 1–2 (see [../challenges_blockers_resolutions/phase-1.md](../challenges_blockers_resolutions/phase-1.md) C1–C13, [phase-2.md](../challenges_blockers_resolutions/phase-2.md) C1–C6) showed that label-proximity and role-based selectors are the #1 source of spec flakiness:

- duplicate/hidden labels break `getByLabel` (sign-in-2 strict-mode collision, phase-1 C13)
- Mantine dropdown options detach mid-click; only stable handles survive re-renders
- async-selects expose no `input[role="combobox"]`; the only reliable handle is `data-testid="async-select-<field>"` (async-field.tsx:236)

The rule going forward (now in root [AGENTS.md](../../../AGENTS.md) → "Alpha QA workflow rules (always)", rule 1):

> Every user-visible UI element carries a `data-testid`. e2e specs select by testid. Label-proximity selectors are permitted only as documented fallback, never as primary strategy.

## 2. Naming convention (canonical)

Format: `<scope>-<element>[-<variant>]`, kebab-case, stable across refactors.

| Category | Pattern | Example |
|---|---|---|
| Header / toolbar | `header-<action>` | `header-search`, `header-new`, `header-delete`, `header-export` *(exists)* |
| Table | `data-table-<part>` | `data-table-row`, `data-table-body` *(exists)* |
| Pagination | `pagination-<part>` | `pagination-controls`, `pagination-page-size` *(exists)* |
| Dialogs | `confirm-dialog[-<button>]` | `confirm-dialog-confirm`, `confirm-dialog-cancel` *(exists)* |
| Form field input | `field-<fieldName>` | `field-name`, `field-genericProductId` |
| Async select trigger | `async-select-<fieldName>` | *(exists, async-field.tsx:236)* |
| Async option | `async-option-<label>` | *(exists, async-field.tsx:279)* |
| Static select | `field-<fieldName>` (input) + `field-<fieldName>-option` | `field-status-option-active` |
| Wizard tab / stepper | `wizard-tab-<tabValue>` | `wizard-tab-general` |
| Footer buttons | `form-previous`, `form-next`, `form-create-continue`, `form-submit` | — |
| Page / modal title | `page-title` *(exists, rx-page.tsx:51)*, `modal-title` | — |
| Domain-prefixed screens | keep `<domain>-<element>` | `pos-complete-sale-btn`, `po-add-line`, `sign-in-submit` |

Rules:

1. Testids describe **role in the page**, not styling or position. Never index-based (`row-3` is forbidden).
2. Repeating elements: stable id from data (`async-option-<label>`, `field-x-option-<value>`); if no stable key exists, that is a task-blocker, raise it.
3. One element, one testid. Do not reuse a testid for different elements in one view.
4. Server-driven or duplicated labels must never be used inside a testid.

## 3. Audit — current coverage

### 3.1 Covered (keep, align to convention)

| Component | Testids | File |
|---|---|---|
| HeaderBar | `header-search/new/delete/export` | `src/features/components/table/HeaderBar.tsx` |
| Table | `data-table-body`, `data-table-row` | `src/features/components/table/table.tsx:58,90` |
| Pagination | `pagination-records-total/controls/page-size` | `src/features/components/table/pagination.tsx` |
| ConfirmDialog | `confirm-dialog`, `-cancel`, `-confirm` | `src/components/confirm-dialog.tsx` |
| AsyncSelectField | `async-select-<field>`, `async-option-<label>` | `src/features/components/form/async-field.tsx:236,279` |
| Page title | `page-title` | `src/features/components/page/rx-page.tsx:51` |
| Sign-in | `sign-in-*` | `src/features/rxsoft/pages/sign-in/index.tsx:279–357` |
| PO suite | `po-*` | `src/features/shop/po/**` |
| POS suite | `pos-*` | `src/features/shop/pos/**` |
| Errors | `error-*` | `src/features/errors/**` |
| Nav / team switcher | `nav-user-trigger`, `sign-out-menu-item`, `team-switcher-trigger` | `src/layout/**` |
| Stock balance search | `stock-balance-*` | `src/features/rxsoft/pages/inventory/index.tsx:696–718` |

### 3.2 Gaps (must add)

| Gap | File | Work |
|---|---|---|
| Plain form inputs (text, number, textarea, date, password, checkbox) — **no testid on any branch** | `src/features/components/form/RenderField.tsx` (~503 lines, all type branches) | `data-testid={\`field-${field.name}\`}` on every rendered input |
| SelectField static select | `src/features/components/form/RenderField.tsx` (`field.type === 'select'` branch, ~line 165) | input testid `field-<name>`; expose options `field-<name>-option` |
| Wizard Stepper steps | `src/features/components/form/tab-groups.tsx:56–70` | `data-testid={\`wizard-tab-${tab.value}\`}` on each `Stepper.Step` |
| Footer buttons Previous / Next / Create & Continue / Submit | `src/features/components/form/tab-groups.tsx:90–115` | `form-previous` / `form-next` / `form-create-continue` / `form-submit` |
| ModalDataForm wrapper | `src/features/components/form/ModalDataForm.tsx` | `modal-title` on the modal title, `modal-form` on the form element |
| Field error messages | all branches in RenderField | `field-error-<name>` (see companion task [schema_validation_task.md](schema_validation_task.md)) |
| Remaining LabelField-embedded inputs | any custom field renderers outside RenderField | sweep with the lint rule in §5 |

## 4. Implementation steps

1. **Foundations** (PR 1): add testids to RenderField.tsx (all branches), tab-groups.tsx (stepper + footer), ModalDataForm.tsx per §3.2. No behavior change.
2. **Domain screens sweep** (PR 2+): rxsoft/lis/emr/identity/communication screens not covered by §3.1; use the codemod, then hand-fix.
3. **Codemod**: script `frontend/e2e/tasks/codemods/add-testid.mjs` — walks `src/features/**`, flags interactive elements (Mantine `TextInput`, `PasswordInput`, `NumberInput`, `Textarea`, `Select`, `Switch`, `Checkbox`, `Button`) missing `data-testid`, emits a report; auto-fix where the field name is statically available.
4. **Spec migration**: `crud-shell.page.ts` → `fillField()` / `chooseOption()` become testid-first (`field-<name>`), label-proximity kept as fallback behind a `legacy:` flag; items-wizard.spec.ts switches to the new helpers; delete fallbacks as screens gain testids.

## 5. Enforcement (so this never erodes)

- **Lint**: extend `oxlint.config.ts` with a custom rule (or a dedicated eslint-plugin-local rule in CI): error on JSX of interactive elements without `data-testid`. Start in `warn` for one sprint, then `error`.
- **CI grep gate** (cheap interim): `! grep -rn "TextInput\b" src/features --include='*.tsx' | ...` style check in the format/test workflow that fails on files added without testids — replace with the lint rule once available.
- **e2e guard**: `tests/rxsoft/testid-audit.spec.ts` — crawls registered ModelConfigs, mounts each form, asserts every input has a testid; fails with a list. Run weekly (not per-PR).
- **AGENTS.md rule 1** stays the human-facing contract; link this doc as the spec.

## 6. Acceptance criteria

- [ ] Every branch of RenderField.tsx renders `data-testid="field-<name>"` (and `field-error-<name>` where error is rendered)
- [ ] Stepper steps expose `wizard-tab-<value>`; footer buttons expose the four form-* testids
- [ ] `crud-shell.page.ts` helpers select testid-first; items-wizard.spec.ts passes with zero label-proximity lookups
- [ ] Lint rule or CI gate active; audit spec exists and runs
- [ ] Docs updated: this file status → Done; INDEX.md row added

## 7. Estimate

| Chunk | Size |
|---|---|
| Foundations PR (RenderField/tab-groups/ModalDataForm) | 0.5 day |
| Domain screens sweep + codemod | 1–2 days |
| Spec migration + helper rework | 0.5 day |
| Enforcement (lint rule + audit spec) | 1 day |
| **Total** | **3–4 dev-days** |
