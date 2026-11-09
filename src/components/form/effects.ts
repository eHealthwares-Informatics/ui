/**
 * Effects System for Declarative Form Operations
 *
 * Handles:
 * - Data fetching (mount or watch-triggered)
 * - Field synchronization (field A → field B)
 * - Computed fields (derived values)
 */

import {
  FieldGroupEffect,
  FormContextValue,
  FormState,
  EffectsContext,
} from './types/form-context';

/**
 * Run all effects for a FieldGroup
 * Effects are declarative rules that replace imperative useEffect logic
 */
export async function runEffects<T extends FormState = FormState>(
  effects: FieldGroupEffect[] | undefined,
  context: EffectsContext<T>
): Promise<void> {
  if (!effects || effects.length === 0) {
    return;
  }

  const promises = effects.map((effect) => runEffect(effect, context));
  await Promise.all(promises);
}

/**
 * Run a single effect
 */
async function runEffect<T extends FormState = FormState>(
  effect: FieldGroupEffect,
  context: EffectsContext<T>
): Promise<void> {
  switch (effect.type) {
    case 'fetch':
      return runFetchEffect(effect, context);
    case 'sync-form':
      return runSyncEffect(effect, context);
    case 'compute':
      return runComputeEffect(effect, context);
    default:
      console.warn('Unknown effect type:', (effect as any).type);
  }
}

/**
 * Fetch effect: Load data from endpoint and update form
 *
 * @example
 * {
 *   type: 'fetch',
 *   trigger: 'mount',
 *   endpoint: '/api/patients',
 *   target: 'formState'
 * }
 */
async function runFetchEffect<T extends FormState = FormState>(
  effect: Extract<FieldGroupEffect, { type: 'fetch' }>,
  context: EffectsContext<T>
): Promise<void> {
  try {
    // Build query parameters from watch dependencies
    let url = effect.endpoint;
    const params = new URLSearchParams();

    if (effect.params) {
      Object.entries(effect.params).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const method = effect.method || 'get';
    const response = await fetch(url, { method });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Update target location
    if (effect.target === 'formState') {
      if (Array.isArray(data)) {
        // If data is array, set as first field value (or configurable)
        context.form.setField(Object.keys(context.form.formState)[0] as any, data as any);
      } else {
        // If data is object, spread into form state
        context.form.setFields(data);
      }
    } else if (effect.target === 'localRows' && context.setLocalRows) {
      // Set local rows for collection mode
      context.setLocalRows(Array.isArray(data) ? data : [data]);
    }
  } catch (error) {
    console.error('Fetch effect error:', error);
    // Don't throw - effects should fail gracefully
  }
}

/**
 * Sync effect: Synchronize one field value to another
 *
 * @example
 * {
 *   type: 'sync-form',
 *   trigger: 'change',
 *   field: 'firstName',
 *   to: 'displayName',
 *   transform: (value) => value.toUpperCase()
 * }
 */
function runSyncEffect<T extends FormState = FormState>(
  effect: Extract<FieldGroupEffect, { type: 'sync-form' }>,
  context: EffectsContext<T>
): void {
  const sourceValue = context.form.getField(effect.field as keyof T);

  // Apply transform if provided
  const targetValue = (effect as any).transform
    ? (effect as any).transform(sourceValue)
    : sourceValue;

  context.form.setField(effect.to as keyof T, targetValue);
}

/**
 * Compute effect: Calculate derived field values based on watched dependencies
 *
 * @example
 * {
 *   type: 'compute',
 *   watch: ['firstName', 'lastName'],
 *   compute: ({ form }) => ({
 *     fullName: `${form.getField('firstName')} ${form.getField('lastName')}`
 *   })
 * }
 */
function runComputeEffect<T extends FormState = FormState>(
  effect: Extract<FieldGroupEffect, { type: 'compute' }>,
  context: EffectsContext<T>
): void {
  try {
    const computed = effect.compute(context.form);
    context.form.setFields(computed as Partial<T>);
  } catch (error) {
    console.error('Compute effect error:', error);
  }
}

/**
 * Setup effect watchers (for watch triggers)
 * Returns cleanup function
 */
export function setupEffectWatchers<T extends FormState = FormState>(
  effects: FieldGroupEffect[] | undefined,
  context: EffectsContext<T>,
  onEffectChange: (effect: FieldGroupEffect) => Promise<void>
): () => void {
  if (!effects || effects.length === 0) {
    return () => {};
  }

  // Collect all watch-triggered effects
  const watchedEffects = effects.filter((e) => e.type === 'fetch' && e.trigger === 'watch');

  if (watchedEffects.length === 0) {
    return () => {};
  }

  // Track previous watched values to detect changes
  const previousValues = new Map<string, any>();
  watchedEffects.forEach((effect) => {
    if (effect.type === 'fetch' && effect.watch) {
      effect.watch.forEach((fieldName) => {
        previousValues.set(fieldName, context.form.getField(fieldName as keyof T));
      });
    }
  });

  // Setup interval-based polling for watched effects
  // (production would use more sophisticated reactivity)
  const checkInterval = setInterval(async () => {
    let changed = false;

    watchedEffects.forEach((effect) => {
      if (effect.type === 'fetch' && effect.watch) {
        effect.watch.forEach((fieldName) => {
          const currentValue = context.form.getField(fieldName as keyof T);
          const previousValue = previousValues.get(fieldName);

          if (currentValue !== previousValue) {
            previousValues.set(fieldName, currentValue);
            changed = true;
            onEffectChange(effect).catch(console.error);
          }
        });
      }
    });
  }, 500); // Check every 500ms

  return () => clearInterval(checkInterval);
}

/**
 * Helper: Execute effects with error boundary
 */
export async function executeEffectsWithHandler<T extends FormState = FormState>(
  effects: FieldGroupEffect[] | undefined,
  context: EffectsContext<T>,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    await runEffects(effects, context);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    console.error('Effects execution failed:', err);
  }
}

/**
 * Build effect watchers for all watch-based effects
 * This creates reactive dependencies without direct React dependency
 */
export function buildEffectDependencies(effects: FieldGroupEffect[] | undefined): string[] {
  if (!effects) {
    return [];
  }

  const dependencies = new Set<string>();

  effects.forEach((effect) => {
    if (effect.type === 'fetch' && effect.watch) {
      effect.watch.forEach((dep) => dependencies.add(dep));
    } else if (effect.type === 'compute' && effect.watch) {
      effect.watch.forEach((dep) => dependencies.add(dep));
    }
  });

  return Array.from(dependencies);
}
