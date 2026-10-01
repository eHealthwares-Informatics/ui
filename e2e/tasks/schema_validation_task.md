# Task: UI must visibly enforce schema + business rules before submission

**Status**: Partially landed 2026-09-30 — see §8 "Landed implementation"; remaining: live green run + board entries

## 8. Landed implementation (2026-09-30)

- `form/submit.ts`: shared `validateFields` + `renderValidationErrors` + `clearValidationErrors` exported alongside `useValidatedSubmit`.
- `form/RenderField.tsx`: `field-error-<name>` spans now render **unconditionally** (previously `{fieldError && …}` — the gate's DOM-poked errors could never appear on first failure). 9 branches.
- `page/data-page-form.tsx`: outer Stack carries `className="rx-page-form"` so page-form summaries (not just modals) have an anchor.
- `form/tab-groups.tsx`: **step gate** — draft-creating transitions (tab-1 → `waitFor: 'id'` tabs via Create & Continue) now validate the active tab's fields and block the POST visibly on failure. Scoped to draft transitions only, so price/stock tabs' own required fields never block plain navigation.
- `e2e/tests/rxsoft/items-validation.spec.ts`: VAL-01 (empty submit → per-field errors + aria-invalid + focus + zero POSTs), VAL-02 (fix → errors clear + exactly one POST), VAL-03 (summary lists all three offending fields), VAL-04 (UI required set == CreateItemDto via `/api/docs-json`, skip-gated on the docs endpoint).
- Found + fixed en route: the wizard's "Next" (Create & Continue) previously bypassed the zod gate entirely — that hole is closed by the step gate.
- Pending: live green run (identity/seed down), then VAL TC board entries via board_updates.md.
**Priority**: Critical — root cause of phase-2 challenge C2 ("quiet validation")
**Owner**: frontend (primary) + rxsoft (DTO alignment) + e2e
**Requested by**: John — *"investigate and generate detailed task on how to make sure UI enforces validations (schema and biz rules) before submission including updates needed in tests and playwright e2e"*

---

## 1. Problem statement (as observed in Phase 2)

On the items create wizard (`/rxsoft/items/create`), submitting with empty required fields produces **no visible error, no DOM change, and no POST request**. The wizard silently refuses. e2e tests cannot distinguish "validation worked" from "button is broken", and users get no feedback at all.

## 2. Root-cause investigation (verified against source)

### 2.1 The validation machinery exists but is bypassed on submit

The form stack has three layers:

| Layer | File | What it does today |
|---|---|---|
| Custom FormProvider | [form-context.tsx](../../src/features/components/form/form-context.tsx) | State container; `FormProviderProps` has an `onSubmit` hook, but page forms never pass it |
| React-Hook-Form rules | [FieldGroup.tsx:129–143](../../src/features/components/form/FieldGroup.tsx#L129-L143) | Registers `required` / `pattern` / `validate` rules per field; errors land in `fieldState.error` and are passed to inputs as `error={fieldError}` in [RenderField.tsx](../../src/features/components/form/RenderField.tsx) |
| Submit path | [data-page-form.tsx:182](../../src/features/components/page/data-page-form.tsx#L182), [ModalDataForm.tsx:63–65](../../src/features/components/form/ModalDataForm.tsx#L63-L65) | **Submit button calls `mutation.mutate(formState)` directly** — RHF `handleSubmit()` / `trigger()` never runs, so rules never evaluate, errors never populate, nothing renders |

### 2.2 Secondary contributors

1. **Schema hook is a stub.** `FieldGroupSpec.validation: { schema?, mode? }` is declared in [form-context.ts:108–111](../../src/features/components/form/types/form-context.ts#L108) with a comment *"Zod/Yup schema"* — no consumer implements it.
2. **`validateMutationForMode`** ([mutation.ts:238](../../src/features/components/form/mutation.ts#L238)) validates *mutation actions* per mode (row/cell/collection), not field validity — it swallows events with only a `console.warn`, which contributed to the "silent" feel but is not the field-validation gate.
3. **UI ⇄ DTO drift.** Items create page marks Generic Product, Purchase UOM, Sale UOM as required (starred, phase-2 C2) while `CreateItemDto` ([create-item.dto.ts](../../../rxsoft/src/modules/catalog/dto/create-item.dto.ts)) allows them optional — and vice-versa risk for future screens. Required-ness is hand-copied per field in schema configs (`required: true` in itemsConfig etc.), with no single source of truth.
4. **Stepper guard ≠ validation.** `hasUnsatisfiedWaitFor` ([tab-groups.tsx:27–37](../../src/features/components/form/tab-groups.tsx#L27-L37)) blocks stepping past tabs with unmet `waitFor` — that's create-draft gating, not schema validation, and passes silently by design.

## 3. Target design

### 3.1 Single submit gate (frontend core)

Introduce one validated submit path used by **both** page forms and modal forms:

```ts
// form/submit.ts (new)
export function useValidatedSubmit({
  fieldGroups, formState, mutation, onError,
}) {
  return async () => {
    // 1. run schema validation (zod schema built from fieldGroups, see 3.2)
    // 2. cross-field / business rules (field.validate fns + schema refinements)
    // 3. if invalid: populate field errors, focus first invalid field,
    //    render form-level summary, DO NOT call mutation.mutate
    // 4. if valid: mutation.mutate(formState)
  };
}
```

- `data-page-form.tsx:182` and `ModalDataForm.tsx:64` switch from `mutation.mutate(formState)` to this hook. Keep `onSubmit` prop on `FormProvider` wired through where a consumer wants a custom sink.

### 3.2 Schema as source of truth (frontend + backend)

- Generate a **zod schema per form** from the existing fieldGroup config (`field.required`, `type`, `pattern`, `min/max`) — no hand-maintained duplicate. `FieldGroupSpec.validation.schema` becomes real: when provided, it overrides/augments the generated one.
- Business rules go in as `.refine()` on the generated schema plus the existing per-field `validate` fns (cross-field rules like "sale price ≥ purchase price" belong here).
- **DTO alignment task (rxsoft side)**: audit `required: true` flags in frontend configs against backend DTOs per resource; fix mismatches (known: Generic Product, Purchase/Sale UOM vs `CreateItemDto`). Where the backend is right, relax the UI star; where the UI is right, tighten the DTO. Add a note per screen in this doc as screens are aligned.

### 3.3 Visible failure contract (the part e2e can test)

On a failed submit attempt the UI MUST render, within the form scope:

1. Per-field error text: `data-testid="field-error-<fieldName>"` with a human message ("Name is required"), input gets `aria-invalid="true"`.
2. A form-level summary: `data-testid="form-error-summary"` listing the count + first few offending fields.
3. Focus moves to the first invalid field.
4. **No mutation fires** (observable: zero POST/PATCH requests).
5. Success path unchanged: valid submit fires exactly one POST.

Also render errors on blur/change for touched fields (RHF `mode: 'onBlur'` equivalent in the custom provider) so users get feedback before reaching Submit.

## 4. Playwright e2e updates (this repo, `frontend/e2e`)

### 4.1 New shared helper — `page-objects/validation-assertions.ts`

```ts
export async function expectBlockedSubmit(page, opts: {
  fieldErrors: string[];        // field names expected to error
  noRequestsTo?: string;        // e.g. '**/api/items' — assert zero calls
}) { /* assert field-error-<name> visible, aria-invalid, form-error-summary,
       route-fired counter === 0 */ }
```

Uses a route intercept counter (pattern proven in phase-2 probes):

```ts
let postCount = 0;
await page.route('**/api/items', (r) => { if (r.request().method() === 'POST') postCount++; r.continue(); });
```

### 4.2 New TC family — add to crud-suite + board

For every create/edit screen registered via ModelConfig (starting with items):

| New TC | Asserts |
|---|---|
| `VAL-01 empty-submit-blocked` | submit empty → per-field errors visible, `form-error-summary` visible, zero POSTs |
| `VAL-02 error-clears-on-fix` | fill the offending field → its `field-error-*` disappears, submit succeeds, exactly one POST |
| `VAL-03 biz-rules` | one cross-field rule per screen → visible error, zero POSTs |
| `VAL-04 dtos-aligned` | required-flag set in UI == required set in backend DTO (data-driven table, backend-checked via OpenAPI/dto snapshot) |

Testids these depend on come from [data_test_id_task.md](data_test_id_task.md) (`field-error-<name>`, `form-submit`); that task lands first or in the same PR.

### 4.3 Existing specs

- items-wizard.spec.ts: the TC that asserts "wizard refuses to step past invalid step" (TC-16 area) stays — but after this work, invalid submit should also show errors; add the visible-error assertion so quiet-regression can never return.
- Add `VAL-01` to the items wizard as its first-class TC and write the new UC/TC entries to the board **via [../board_updates.md](../board_updates.md)** (scrum-master flow), not ad-hoc gh calls.

## 5. Implementation steps (ordered)

1. `useValidatedSubmit` + zod-schema generation from fieldGroups; wire into data-page-form + ModalDataForm (items screen first).
2. Render `field-error-<name>` + `aria-invalid` + `form-error-summary` in RenderField/LabelField; focus-first-invalid.
3. Items DTO alignment (Generic Product, Purchase/Sale UOM) + audit checklist for other screens.
4. e2e: validation-assertions helper + VAL-01..04 for items; extend crud-suite template.
5. Board write-back via board_updates.md; CI: `yarn format:write` before push.

## 6. Acceptance criteria

- [ ] Submit with empty required fields on items: visible per-field errors + summary + zero POST (e2e-verified, TC-RX-ITEMS-VAL-01 green)
- [ ] Valid submit fires exactly one POST (no double-fire regression from the new gate)
- [ ] Required flags UI == DTO for items; audit table started for remaining screens
- [ ] At least one business rule per major screen expressed as schema refine/validate fn with visible error
- [ ] All new TCs on the board ticked only after verified runs (honesty rule C12)

## 7. Estimate

| Chunk | Size |
|---|---|
| useValidatedSubmit + schema generation | 1.5 days |
| Error rendering + focus management | 1 day |
| DTO alignment audit (items + 3 screens) | 0.5 day |
| e2e helper + 4 VAL TCs + crud-suite integration | 1 day |
| **Total** | **~4 dev-days** |
