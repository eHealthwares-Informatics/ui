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
      case 'select':
      case 'remote-select':
      case 'multi-async-select':
      case 'multi-pick':
        typeSchema = z.any(); // object/option type
        break;
      case 'json':
        typeSchema = z.any();
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
      } else if (
        field.type === 'async-select' ||
        field.type === 'select' ||
        field.type === 'remote-select' ||
        field.type === 'multi-async-select' ||
        field.type === 'multi-pick' ||
        field.type === 'json'
      ) {
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
      if (
        field.type === 'async-select' ||
        field.type === 'select' ||
        field.type === 'remote-select' ||
        field.type === 'multi-async-select' ||
        field.type === 'multi-pick' ||
        field.type === 'json'
      ) {
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
  const errors: Record<string, string> = {};

  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = issue.message;
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

/**
 * Clear all rendered validation error markers (per-field + summary + aria-invalid).
 */
export function clearValidationErrors(): void {
  const existingSummary = document.querySelector('[data-testid="form-error-summary"]');
  if (existingSummary) existingSummary.remove();
  document.querySelectorAll('[data-testid^="field-error-"]').forEach((el) => {
    el.textContent = '';
    (el as HTMLElement).style.display = 'none';
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
 * aria-invalid on fields, focus on the first invalid field.
 */
export function renderValidationErrors(errors: Record<string, string>): void {
  clearValidationErrors();

  for (const [name, message] of Object.entries(errors)) {
    const errorEl = document.querySelector(`[data-testid="field-error-${name}"]`);
    if (errorEl) {
      errorEl.textContent = message;
      (errorEl as HTMLElement).style.display = 'block';
    }
    // Text inputs: testid field-<name> sits on the <input> itself.
    // Async-selects: LabelField drops data-testid, so the control's testid
    // is async-select-<name> (Mantine InputBase → the <input> element).
    const fieldEl =
      document.querySelector(`[data-testid="field-${name}"]`) ??
      document.querySelector(`[data-testid="async-select-${name}"]`);
    if (fieldEl) {
      fieldEl.setAttribute('aria-invalid', 'true');
    }
  }

  const formEl = document.querySelector('[data-testid="modal-form"], .rx-page-form');
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
      .map(([name, msg]) => `<li>${msg}</li>`)
      .join('')}</ul>`;
    formEl.prepend(summary);
  }

  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    const firstField = document.querySelector(
      `[data-testid="field-${firstErrorField}"], [data-testid="async-select-${firstErrorField}"]`
    ) as HTMLElement | null;
    if (firstField) {
      firstField.focus();
    }
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

  if (!builtSchemaRef.current) {
    builtSchemaRef.current = buildZodSchema(fields);
  }

  return useCallback(async () => {
    if (!builtSchemaRef.current) return;
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

    const result = refinedSchema.safeParse(formState);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        // Only store the first error per field
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      renderValidationErrors(errors);
      onError?.(errors);
      return;
    }

    // Valid — clear any existing error markers
    clearValidationErrors();

    // Fire mutation
    mutation.mutate(formState);
  }, [fields, formState, mutation, onError]);
}
