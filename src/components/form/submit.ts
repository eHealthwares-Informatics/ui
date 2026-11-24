/**
 * Validate + Submit Gate
 *
 * Single validated submit path used by both page forms and modal forms.
 * Generates a zod schema from fieldGroup configs, runs cross-field
 * business rules, and blocks mutation on validation failure.
 */

import { useCallback, useRef } from 'react';
import { z } from 'zod';
import type { Field } from '@/features/rxsoft/types';

/**
 * Zod schema + refine list generated from a batch of FieldGroups.
 */
export type BuiltSchema = {
  schema: z.ZodObject<any>;
  fieldRules: Array<{
    name: string;
    refine: (data: Record<string, unknown>) => boolean | string;
  }>;
};

/** Field types whose value is an ARRAY of options (multi-selects). */
const MULTI_SELECT_TYPES = new Set(['multi-async-select', 'multi-pick', 'permission-picker']);

/**
 * Field types whose value is a structured object/array rather than a primitive.
 * These must validate as `z.any()` — falling through to the string branch made
 * Zod reject perfectly valid values ("expected string, received array/object"),
 * e.g. a questionnaire's `questions` (accordion-array) and `workflowId`
 * (accordion object) on the edit form.
 */
const STRUCTURED_TYPES = new Set([
  'async-select',
  'autocomplete',
  'select',
  'remote-select',
  'multi-async-select',
  'multi-pick',
  'permission-picker',
  'json',
  'accordion',
  'accordion-array',
  'json-accordion-array',
  'daterange',
  'multi-check',
  'multi-image',
  'image',
]);

/**
 * Structured types whose value is an ARRAY of arbitrary entries (not option
 * objects). Required means "at least one entry" — the object `value` check used
 * for selects cannot pass for arrays.
 */
const ARRAY_VALUE_TYPES = new Set([
  'multi-async-select',
  'multi-pick',
  'permission-picker',
  'accordion-array',
  'json-accordion-array',
  'daterange',
  'multi-check',
  'multi-image',
]);

/**
 * A selected multi-select entry is usable when it is a non-empty string
 * (role/category code) or an option object carrying a value/id/code —
 * mirroring extractOptionId in payload-utils.
 */
function hasUsableOptionValue(entry: unknown): boolean {
  if (typeof entry === 'string') return entry.trim().length > 0;
  if (entry && typeof entry === 'object') {
    const value =
      (entry as Record<string, unknown>).value ?? (entry as any).id ?? (entry as any).code;
    return value !== undefined && value !== null && String(value).length > 0;
  }
  return false;
}

/** Field name → human label, for turning raw Zod messages into readable ones. */
function labelMapFor(fields: Field[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of fields) {
    map.set(field.name, field.label);
  }
  return map;
}

type ValidationIssue = { path: (string | number)[]; message: string; code?: string };

/**
 * Message shown to the user for one Zod issue. Raw type errors
 * ("Invalid input: expected string, received array") are replaced with the
 * field label; custom messages that already name the field are kept as-is.
 */
function messageForIssue(issue: ValidationIssue, labels: Map<string, string>): string {
  const root = String(issue.path[0] ?? '');
  const label = labels.get(root) ?? root;
  if (issue.code === 'invalid_type') {
    return label ? `${label} is invalid` : 'Invalid value';
  }
  const message = (issue.message ?? '').trim();
  if (!message) {
    return label ? `${label} is invalid` : 'Invalid value';
  }
  if (label && !message.toLowerCase().includes(label.toLowerCase())) {
    return `${label}: ${message}`;
  }
  return message;
}

/**
 * Build a zod schema from one or more FieldGroup configs.
 *
 * Each field contributes:
 * - required fields → `z.string().min(1, "Name is required")` (or appropriate type)
 * - pattern/validate → `.regex()` / `.refine()`
 * - min/max → `.min()` / `.max()`
 *
 * Business-rule cross-field validations come back as `.refine()` entries
 * so the caller can apply them to the combined schema.
 */
export function buildZodSchema(fields: Field[]): BuiltSchema {
  const shape: Record<string, z.ZodTypeAny> = {};
  const fieldRules: BuiltSchema['fieldRules'] = [];

  for (const field of fields) {
    if (field.type === 'hidden') continue;

    let typeSchema: z.ZodTypeAny;

    // 1. Pick base type
    switch (field.type) {
      case 'number': {
        let numberSchema = z.coerce.number();
        if (field.min !== undefined) numberSchema = numberSchema.min(field.min);
        if (field.max !== undefined) numberSchema = numberSchema.max(field.max);
        // Missing required numbers must surface the field label, not zod's
        // "expected number, received NaN" (z.coerce.number(undefined) → NaN).
        typeSchema = field.required
          ? z
              .any()
              .refine(
                (v) => v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v)),
                `${field.label} is required`
              )
              .pipe(numberSchema)
          : numberSchema;
        break;
      }
      case 'switch':
      case 'checkbox':
        typeSchema = z.boolean();
        break;
      case 'async-select':
      case 'autocomplete':
      case 'select':
      case 'remote-select':
      case 'multi-async-select':
      case 'multi-pick':
      case 'permission-picker':
      case 'json':
      case 'accordion':
      case 'accordion-array':
      case 'json-accordion-array':
      case 'daterange':
      case 'multi-check':
      case 'multi-image':
      case 'image':
        typeSchema = z.any(); // object/option/array type
        break;
      case 'email': {
        const emailSchema = z.string().email('Invalid email address');
        // Missing required emails must surface the field label, not zod's
        // "expected string, received undefined".
        typeSchema = field.required
          ? z
              .any()
              .refine(
                (v) => typeof v === 'string' && v.trim().length > 0,
                `${field.label} is required`
              )
              .pipe(emailSchema)
          : emailSchema;
        break;
      }
      case 'textarea':
      case 'password':
      case 'color':
      case 'date':
      case 'text':
      default: {
        // Missing required strings must surface the field label, not zod's
        // "expected string, received undefined".
        typeSchema = field.required
          ? z
              .any()
              .refine(
                (v) => typeof v === 'string' && v.trim().length > 0,
                `${field.label} is required`
              )
              .pipe(z.string())
          : z.string();
        break;
      }
    }

    // 2. Required / optional wrapping for types whose required rule is not
    //    folded into the base schema above (selects, switches, json).
    if (field.required) {
      if (field.type === 'switch' || field.type === 'checkbox') {
        typeSchema = (typeSchema as z.ZodBoolean).refine(
          (v) => v === true,
          `${field.label} is required`
        );
      } else if (field.type && MULTI_SELECT_TYPES.has(field.type)) {
        // Multi-selects hold an ARRAY of options (RenderField toggles entries
        // in/out), so the single-object check below can never pass — arrays
        // don't carry a top-level `value` property. Required = at least one
        // selected entry, every entry carrying a usable value.
        typeSchema = z.any().refine((v) => {
          const entries = Array.isArray(v)
            ? v
            : v === null || v === undefined || v === ''
              ? []
              : [v];
          return entries.length > 0 && entries.every(hasUsableOptionValue);
        }, `${field.label} is required`);
      } else if (
        field.type &&
        ARRAY_VALUE_TYPES.has(field.type) &&
        !MULTI_SELECT_TYPES.has(field.type)
      ) {
        // Array-valued fields hold arbitrary entries (e.g. question objects),
        // so "required" means at least one entry — not a selectable option.
        typeSchema = z.any().refine((v) => {
          if (Array.isArray(v)) return v.length > 0;
          return v !== null && v !== undefined && v !== '';
        }, `${field.label} is required`);
      } else if (field.type && STRUCTURED_TYPES.has(field.type)) {
        typeSchema = z
          .any()
          .refine(
            (v) =>
              v !== null &&
              v !== undefined &&
              v !== '' &&
              !(
                typeof v === 'object' &&
                v !== null &&
                (!('value' in v) || v.value === '' || v.value === undefined)
              ),
            `${field.label} is required`
          );
      }
      // number / string / email already carry a friendly required refine.
    } else {
      // Optional fields can be null/undefined
      if (field.type && STRUCTURED_TYPES.has(field.type)) {
        typeSchema = z.any().nullable().optional();
      } else if (field.type === 'number') {
        typeSchema = (typeSchema as z.ZodNumber).optional().nullable();
      } else if (field.type === 'switch') {
        typeSchema = typeSchema.optional().default(false);
      } else {
        typeSchema = (typeSchema as z.ZodString).optional().nullable();
      }
    }

    // 3. Custom validate function
    if (field.validate) {
      const origValidate = field.validate;
      fieldRules.push({
        name: field.name,
        refine: (data: Record<string, unknown>) => {
          const result = origValidate(data[field.name]);
          if (result === true) return true;
          return result || `${field.label} is invalid`;
        },
      });
    }

    shape[field.name] = typeSchema;
  }

  return { schema: z.object(shape), fieldRules };
}

/**
 * Validate a formState against a field list. Returns a map of
 * field name -> error message (empty object when valid).
 */
export function validateFields(
  fields: Field[],
  data: Record<string, unknown>
): Record<string, string> {
  const { schema, fieldRules } = buildZodSchema(fields);
  const labels = labelMapFor(fields);
  const errors: Record<string, string> = {};

  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = messageForIssue(issue as ValidationIssue, labels);
      }
    }
  }

  for (const rule of fieldRules) {
    const ruleResult = rule.refine(data);
    if (ruleResult !== true && !errors[rule.name]) {
      errors[rule.name] = typeof ruleResult === 'string' ? ruleResult : 'Invalid value';
    }
  }

  return errors;
}

/** Escape text used inside the summary's innerHTML. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/**
 * Clear all rendered validation error markers (per-field + summary + highlight).
 */
export function clearValidationErrors(): void {
  const existingSummary = document.querySelector('[data-testid="form-error-summary"]');
  if (existingSummary) existingSummary.remove();
  document.querySelectorAll('[data-testid^="field-error-"]').forEach((el) => {
    el.textContent = '';
    (el as HTMLElement).style.display = 'none';
  });
  // Error spans we created for field types that don't render their own.
  document.querySelectorAll('[data-validation-error="true"]').forEach((el) => el.remove());
  document.querySelectorAll('.rx-field-invalid').forEach((el) => {
    el.classList.remove('rx-field-invalid');
  });
  // aria-invalid may sit on field-<name> (text inputs) or async-select-<name>
  // (async-selects carry their testid on the Mantine InputBase input itself).
  document
    .querySelectorAll('[data-testid^="field-"], [data-testid^="async-select-"]')
    .forEach((el) => {
      el.removeAttribute('aria-invalid');
    });
}

/**
 * Render a field->message error map into the DOM:
 * per-field `field-error-<name>` spans, a `form-error-summary` alert,
 * aria-invalid + `rx-field-invalid` highlight on the invalid field, focus on
 * the first invalid field. Nested paths (e.g. `questions.3.text`) are applied
 * to their root field (`questions`) so the message/highlight is always visible.
 */
export function renderValidationErrors(errors: Record<string, string>): void {
  clearValidationErrors();

  const formEl = document.querySelector('[data-testid="modal-form"], .rx-page-form');

  for (const [name, message] of Object.entries(errors)) {
    const root = name.split('.')[0];

    // Error text: reuse the field's own span, or create one for field types
    // (accordion/accordion-array/json-accordion-array…) that render none.
    let errorEl = document.querySelector(
      `[data-testid="field-error-${root}"]`
    ) as HTMLElement | null;
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.setAttribute('data-testid', `field-error-${root}`);
      errorEl.setAttribute('data-validation-error', 'true');
      errorEl.setAttribute('role', 'alert');
      errorEl.style.cssText =
        'color: var(--mantine-color-red-6); font-size: var(--mantine-font-size-xs); display:block; margin-top:4px;';
      const host = document.querySelector(`[data-testid="field-${root}"]`) as HTMLElement | null;
      (host?.parentElement ?? host ?? formEl)?.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';

    // Highlight the field wrapper AND its inner control (border turns red via
    // the .rx-field-invalid class in global.css).
    const fieldEl = document.querySelector(
      `[data-testid="field-${root}"], [data-testid="async-select-${root}"]`
    ) as HTMLElement | null;
    if (fieldEl) {
      fieldEl.setAttribute('aria-invalid', 'true');
      fieldEl.classList.add('rx-field-invalid');
      const control = fieldEl.querySelector(
        'input, textarea, select, [role="combobox"], button'
      ) as HTMLElement | null;
      if (control) {
        control.setAttribute('aria-invalid', 'true');
        control.classList.add('rx-field-invalid');
      }
    }
  }

  if (formEl) {
    const summary = document.createElement('div');
    summary.setAttribute('data-testid', 'form-error-summary');
    summary.setAttribute('role', 'alert');
    summary.style.cssText =
      'color: var(--mantine-color-red-6); background: var(--mantine-color-red-0); padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 14px;';
    summary.innerHTML = `<strong>${Object.keys(errors).length} field(s) need attention</strong><ul style="margin:8px 0 0 16px;padding:0">${Object.entries(
      errors
    )
      .slice(0, 5)
      .map(([, msg]) => `<li>${escapeHtml(msg)}</li>`)
      .join('')}</ul>`;
    formEl.prepend(summary);
  }

  const firstErrorRoot = Object.keys(errors)[0]?.split('.')[0];
  if (firstErrorRoot) {
    const firstField = document.querySelector(
      `[data-testid="field-${firstErrorRoot}"], [data-testid="async-select-${firstErrorRoot}"]`
    ) as HTMLElement | null;
    const control = firstField?.querySelector(
      'input, textarea, select, [role="combobox"], button'
    ) as HTMLElement | null;
    (control ?? firstField)?.focus?.();
  }
}

/**
 * Hook that returns a validated submit function.
 *
 * Usage:
 * ```ts
 * const handleSubmit = useValidatedSubmit({
 *   fields,
 *   formState,
 *   mutation,
 *   setFieldError,
 * });
 * // ...
 * <Button onClick={handleSubmit}>Submit</Button>
 * ```
 */
export function useValidatedSubmit({
  fields,
  formState,
  mutation,
  onError,
}: {
  fields: Field[];
  formState: Record<string, unknown>;
  mutation: { mutate: (data: Record<string, unknown>) => void; isPending?: boolean };
  onError?: (errors: Record<string, string>) => void;
}) {
  const builtSchemaRef = useRef<BuiltSchema | null>(null);
  // The submit button can be clicked while a debounced input still owns the
  // latest keystroke. Read the most recent form state after the blur/flush
  // instead of the state captured when the render happened.
  const formStateRef = useRef(formState);
  formStateRef.current = formState;

  if (!builtSchemaRef.current) {
    builtSchemaRef.current = buildZodSchema(fields);
  }

  return useCallback(async () => {
    if (!builtSchemaRef.current) return;
    const currentFormState = formStateRef.current;
    const { schema, fieldRules } = builtSchemaRef.current;

    let refinedSchema: z.ZodObject<any> = schema;
    for (const rule of fieldRules) {
      refinedSchema = refinedSchema.superRefine((data, ctx) => {
        const result = rule.refine(data);
        if (result !== true) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [rule.name],
            message: typeof result === 'string' ? result : 'Invalid value',
          });
        }
      }) as unknown as z.ZodObject<any>;
    }

    // Clear form-error-summary
    const existingSummary = document.querySelector('[data-testid="form-error-summary"]');
    if (existingSummary) existingSummary.remove();

    const result = refinedSchema.safeParse(currentFormState);

    if (!result.success) {
      const labels = labelMapFor(fields);
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        // Only store the first error per field
        if (!errors[path]) {
          errors[path] = messageForIssue(issue as ValidationIssue, labels);
        }
      }
      renderValidationErrors(errors);
      onError?.(errors);
      return;
    }

    // Valid — clear any existing error markers
    clearValidationErrors();

    // Fire mutation
    mutation.mutate(currentFormState);
  }, [fields, mutation, onError]);
}
