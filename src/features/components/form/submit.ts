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
export function buildZodSchema(
  fields: Field[],
): BuiltSchema {
  const shape: Record<string, z.ZodTypeAny> = {};
  const fieldRules: BuiltSchema['fieldRules'] = [];

  for (const field of fields) {
    if (field.type === 'hidden') continue;

    let typeSchema: z.ZodTypeAny;

    // 1. Pick base type
    switch (field.type) {
      case 'number':
        typeSchema = z.coerce.number();
        if (field.min !== undefined) typeSchema = (typeSchema as z.ZodNumber).min(field.min);
        if (field.max !== undefined) typeSchema = (typeSchema as z.ZodNumber).max(field.max);
        break;
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
      case 'textarea':
      case 'password':
      case 'email':
      case 'color':
      case 'date':
      case 'text':
      default:
        typeSchema = z.string();
        if (field.type === 'email') {
          typeSchema = z.string().email('Invalid email address');
        }
        break;
    }

    // 2. Required check
    if (field.required) {
      if (field.type === 'switch' || field.type === 'checkbox') {
        typeSchema = (typeSchema as z.ZodBoolean).refine(
          (v) => v === true,
          `${field.label} is required`,
        );
      } else if (
        field.type === 'async-select' ||
        field.type === 'select' ||
        field.type === 'remote-select'
      ) {
        typeSchema = z
          .any()
          .refine(
            (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'object' && v !== null && (!('value' in v) || v.value === '' || v.value === undefined)),
            `${field.label} is required`,
          );
      } else if (field.type === 'number') {
        typeSchema = (typeSchema as z.ZodNumber).refine(
          (v) => v !== undefined && v !== null && !isNaN(Number(v)),
          `${field.label} is required`,
        );
      } else {
        typeSchema = (typeSchema as z.ZodString).min(1, `${field.label} is required`);
      }
    } else {
      // Optional fields can be null/undefined
      if (
        field.type === 'async-select' ||
        field.type === 'select' ||
        field.type === 'remote-select'
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

      // Render per-field errors
      for (const [name, message] of Object.entries(errors)) {
        const errorEl = document.querySelector(
          `[data-testid="field-error-${name}"]`,
        );
        if (errorEl) {
          errorEl.textContent = message;
          (errorEl as HTMLElement).style.display = 'block';
        }
        // Set aria-invalid on the field input
        const fieldEl = document.querySelector(
          `[data-testid="field-${name}"]`,
        );
        if (fieldEl) {
          fieldEl.setAttribute('aria-invalid', 'true');
        }
      }

      // Render form-level error summary
      const formEl = document.querySelector('[data-testid="modal-form"], .rx-page-form');
      if (formEl) {
        const summary = document.createElement('div');
        summary.setAttribute('data-testid', 'form-error-summary');
        summary.setAttribute('role', 'alert');
        summary.style.cssText =
          'color: var(--mantine-color-red-6); background: var(--mantine-color-red-0); padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 14px;';
        summary.innerHTML = `<strong>${Object.keys(errors).length} field(s) need attention</strong><ul style="margin:8px 0 0 16px;padding:0">${Object.entries(errors)
          .slice(0, 5)
          .map(([name, msg]) => `<li>${msg}</li>`)
          .join('')}</ul>`;
        formEl.prepend(summary);
      }

      // Focus first invalid field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const firstField = document.querySelector(
          `[data-testid="field-${firstErrorField}"]`,
        ) as HTMLElement | null;
        if (firstField) {
          firstField.focus();
        }
      }

      onError?.(errors);
      return;
    }

    // Valid — clear any existing error markers
    document.querySelectorAll('[data-testid^="field-error-"]').forEach((el) => {
      el.textContent = '';
      (el as HTMLElement).style.display = 'none';
    });
    document.querySelectorAll('[data-testid^="field-"]').forEach((el) => {
      el.removeAttribute('aria-invalid');
    });

    // Fire mutation
    mutation.mutate(formState);
  }, [fields, formState, mutation, onError]);
}