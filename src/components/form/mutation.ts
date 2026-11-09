/**
 * Mutation Handlers for Different Modes
 *
 * Standardizes how form state is updated based on mutationMode:
 * - row: Add single row to collection
 * - cell: Edit single cell (no persistence)
 * - collection: Multi-row editing with batch save
 * - field: Immediate field update
 */

import {
  MutationMode,
  FormEvent,
  FormContextValue,
  FormState,
  FieldGroupSpec,
  MutationContext,
} from './types/form-context';

/**
 * Execute mutation based on mode
 */
export function runMutation<T extends FormState = FormState>(
  event: FormEvent,
  spec: FieldGroupSpec,
  context: MutationContext<T>
): void {
  const mode = spec.mutationMode || 'field';

  switch (mode) {
    case 'row':
      return handleRowMode(event, spec, context);
    case 'cell':
      return handleCellMode(event, spec, context);
    case 'collection':
      return handleCollectionMode(event, spec, context);
    case 'field':
      return handleFieldMode(event, spec, context);
    default:
      console.warn('Unknown mutation mode:', mode);
  }
}

/**
 * Row Mode: User fills form → Click "Add" → Append to collection → Reset input
 *
 * Flow:
 * 1. User fills form fields
 * 2. Click "Add Row" button
 * 3. Current form values appended to formStateField array
 * 4. Input form resets automatically
 *
 * @example
 * mutationMode: 'row'
 * formStateField: 'items'  // Array of items in form state
 */
function handleRowMode<T extends FormState = FormState>(
  event: FormEvent,
  spec: FieldGroupSpec,
  context: MutationContext<T>
): void {
  // Field change event - just update field
  if (event.type === 'field-change' && event.field) {
    context.form.setField(event.field as keyof T, event.value as any);
    return;
  }

  // Add row action
  if (event.action === 'add-row') {
    const formStateField = spec.formStateField;
    if (!formStateField) {
      console.warn('Row mode requires formStateField');
      return;
    }

    // Get current form values from field names
    const newRow: Record<string, any> = {};
    spec.fields.forEach((field) => {
      newRow[field.name] = context.form.getField(field.name as keyof T);
    });

    // Add row to collection
    const currentCollection = context.form.getField(formStateField as keyof T);
    const updatedCollection = Array.isArray(currentCollection)
      ? [...currentCollection, newRow]
      : [newRow];

    context.form.setField(formStateField as keyof T, updatedCollection as any);

    // Reset input form fields
    spec.fields.forEach((field) => {
      context.form.setField(field.name as keyof T, field.defaultValue ?? (null as any)); //TODO: AS ANY
    });
  }
}

/**
 * Cell Mode: Pure local editing, no automatic updates
 *
 * Flow:
 * 1. User edits field locally (in a table cell)
 * 2. No form state update
 * 3. No persistence triggers
 * 4. Save via explicit "Save" action only
 *
 * @example
 * mutationMode: 'cell'
 * fields: [inline table cell editors]
 */
function handleCellMode<T extends FormState = FormState>(
  event: FormEvent,
  spec: FieldGroupSpec,
  context: MutationContext<T>
): void {
  // Cell changes should stay local (in component state, not form state)
  // This handler is mostly a no-op for cell mode
  // The table/cell component manages its own state

  if (event.action === 'save-cell' && event.payload) {
    // Explicit save only
    const { rowIndex, field, value } = event.payload;
    if (context.setLocalRows && Array.isArray(context.localRows)) {
      const updated = [...context.localRows];
      if (updated[rowIndex]) {
        updated[rowIndex][field] = value;
        context.setLocalRows(updated);
      }
    }
  }
}

/**
 * Collection Mode: Multi-row editing with batch save
 *
 * Flow:
 * 1. User can add/edit/delete rows locally (in localRows state)
 * 2. Rows held in component state, not form state
 * 3. Click "Save All" button
 * 4. All rows saved in ONE setField call
 * 5. Form state updated atomically
 *
 * @example
 * mutationMode: 'collection'
 * formStateField: 'items'
 * fields: [fields for each row]
 */
function handleCollectionMode<T extends FormState = FormState>(
  event: FormEvent,
  spec: FieldGroupSpec,
  context: MutationContext<T>
): void {
  const formStateField = spec.formStateField;

  if (event.action === 'add-row') {
    // Add empty row to local state
    if (context.setLocalRows) {
      const newRow: Record<string, any> = {};
      spec.fields.forEach((field) => {
        newRow[field.name] = field.defaultValue ?? null;
      });
      context.setLocalRows([...(context.localRows || []), newRow]);
    }
  }

  if (event.action === 'update-row' && event.payload) {
    // Update row in local state
    const { rowIndex, field, value } = event.payload;
    if (context.setLocalRows && Array.isArray(context.localRows)) {
      const updated = [...context.localRows];
      if (updated[rowIndex]) {
        updated[rowIndex][field] = value;
        context.setLocalRows(updated);
      }
    }
  }

  if (event.action === 'delete-row' && event.payload) {
    // Delete row from local state
    const { rowIndex } = event.payload;
    if (context.setLocalRows && Array.isArray(context.localRows)) {
      context.setLocalRows(context.localRows.filter((_, i) => i !== rowIndex));
    }
  }

  if (event.action === 'save-all') {
    // Persist all local rows to form state (ONE update)
    if (formStateField && context.localRows) {
      context.form.setField(formStateField as keyof T, context.localRows as any);
    }
  }

  if (event.action === 'reset-rows') {
    // Discard local changes, reload from form state
    if (formStateField) {
      const currentCollection = context.form.getField(formStateField as keyof T);
      context.setLocalRows?.(Array.isArray(currentCollection) ? currentCollection : []);
    }
  }
}

/**
 * Field Mode: Immediate update on every field change
 *
 * Flow:
 * 1. User types in field
 * 2. Immediately update FormProvider state
 * 3. No debuncing required (but allowed for performance)
 * 4. No batch processing
 *
 * @example
 * mutationMode: 'field'
 * fields: [firstName, lastName, email, etc.]
 */
function handleFieldMode<T extends FormState = FormState>(
  event: FormEvent,
  spec: FieldGroupSpec,
  context: MutationContext<T>
): void {
  if (event.type === 'field-change' && event.field && event.value !== undefined) {
    // Direct field update
    context.form.setField(event.field as keyof T, event.value as any);
  }

  if (event.type === 'field-blur' && event.field) {
    // Mark field as touched on blur
    context.form.setFieldTouched(event.field, true);
  }

  if (event.type === 'field-focus' && event.field) {
    // Optional: Mark field as focused
    // Could use custom context attribute for focus state
  }
}

/**
 * Validate mutation is appropriate for mode
 */
export function validateMutationForMode(mode: MutationMode, action: string): boolean {
  const validActions: Record<MutationMode, string[]> = {
    row: ['field-change', 'add-row', 'reset'],
    cell: ['field-change', 'save-cell'],
    collection: ['add-row', 'update-row', 'delete-row', 'save-all', 'reset-rows'],
    field: ['field-change', 'field-blur', 'field-focus'],
  };

  return validActions[mode]?.includes(action) ?? false;
}

/**
 * Helper: Build mutation context
 */
export function buildMutationContext<T extends FormState = FormState>(
  form: FormContextValue<T>,
  spec: FieldGroupSpec,
  localRows?: Record<string, any>[],
  setLocalRows?: (rows: Record<string, any>[]) => void,
  event?: FormEvent
): MutationContext<T> {
  return {
    form,
    localRows,
    setLocalRows,
    event: event || { type: 'field-change' },
    spec,
  };
}

/**
 * Create mutation handler for a specific mode
 */
export function createMutationHandler<T extends FormState = FormState>(mode: MutationMode) {
  return (event: FormEvent, spec: FieldGroupSpec, context: MutationContext<T>) => {
    if (!validateMutationForMode(mode, event.action || event.type)) {
      console.warn(`Invalid action "${event.action}" for mode "${mode}"`);
      return;
    }
    runMutation(event, spec, context);
  };
}
