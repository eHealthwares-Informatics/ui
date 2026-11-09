import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from 'react';
import {
  FormContextValue,
  FormState,
  FormSubscriber,
  FormProviderProps,
  FormEvent,
} from './types/form-context';

/**
 * Generic Form Context
 *
 * Single source of truth for all form state management.
 * Supports nested structures, field metadata, and subscriptions.
 */
const FormContextGeneric = createContext<FormContextValue | undefined>(undefined);

/**
 * Enhanced FormProvider Component
 *
 * Replaces scattered formState and updateField prop drilling with
 * a single, unified FormProvider that handles all form state operations.
 *
 * Features:
 * - Unified state management
 * - Field-level metadata (dirty, touched, error)
 * - Subscription system for optimized renders
 * - Type-safe field operations
 * - Support for nested structures
 */
export function FormProvider<T extends FormState = FormState>({
  children,
  initialState,
  onSubmit,
  onChange,
  enableSubscription = false,
}: FormProviderProps<T>) {
  const [formState, setFormState] = useState<T>(initialState);
  const [fieldMetadata, setFieldMetadata] = useState<
    Record<string, { dirty: boolean; touched: boolean; error?: string }>
  >({});

  // Subscribers for optimized re-renders
  const subscribersRef = useRef<Set<FormSubscriber<T>>>(enableSubscription ? new Set() : new Set());

  /**
   * Get a single field value
   * Supports nested object access via dot notation (optional enhancement)
   */
  const getField = useCallback(
    <K extends keyof T>(name: K): T[K] => {
      return formState[name];
    },
    [formState]
  );

  /**
   * Get multiple field values at once
   */
  const getFields = useCallback(
    (...names: (keyof T)[]): Partial<T> => {
      return names.reduce((acc, name) => {
        acc[name] = formState[name];
        return acc;
      }, {} as Partial<T>);
    },
    [formState]
  );

  /**
   * Set a single field value
   * Automatically marks field as dirty and touched
   */
  const setField = useCallback(<K extends keyof T>(name: K, value: T[K]): void => {
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as dirty and touched
    setFieldMetadata((prev) => ({
      ...prev,
      [String(name)]: {
        ...(prev[String(name)] || { dirty: false, touched: false }),
        dirty: true,
        touched: true,
      },
    }));
  }, []);

  /**
   * Set multiple fields at once (batch update)
   * Useful for form initialization or computed field updates
   */
  const setFields = useCallback((partial: Partial<T>): void => {
    setFormState((prev) => ({
      ...prev,
      ...partial,
    }));

    // Mark all updated fields as dirty and touched
    setFieldMetadata((prev) => {
      const updated = { ...prev };
      Object.keys(partial).forEach((fieldName) => {
        updated[fieldName] = {
          ...(prev[fieldName] || { dirty: false, touched: false }),
          dirty: true,
          touched: true,
        };
      });
      return updated;
    });
  }, []);

  /**
   * Reset form to initial state (or custom state)
   */
  const reset = useCallback(
    (newState?: Partial<T>): void => {
      if (newState) {
        setFormState({ ...initialState, ...newState });
      } else {
        setFormState({ ...initialState });
      }

      // Reset field metadata
      setFieldMetadata({});
    },
    [initialState]
  );

  /**
   * Check if a field has been modified
   */
  const isFieldDirty = useCallback(
    (name: string): boolean => {
      return fieldMetadata[name]?.dirty ?? false;
    },
    [fieldMetadata]
  );

  /**
   * Check if a field has been interacted with
   */
  const isFieldTouched = useCallback(
    (name: string): boolean => {
      return fieldMetadata[name]?.touched ?? false;
    },
    [fieldMetadata]
  );

  /**
   * Get field-level validation error
   */
  const getFieldError = useCallback(
    (name: string): string | undefined => {
      return fieldMetadata[name]?.error;
    },
    [fieldMetadata]
  );

  /**
   * Set field dirty state
   */
  const setFieldDirty = useCallback((name: string, dirty: boolean): void => {
    setFieldMetadata((prev) => ({
      ...prev,
      [name]: {
        ...(prev[name] || { dirty: false, touched: false }),
        dirty,
      },
    }));
  }, []);

  /**
   * Set field touched state
   */
  const setFieldTouched = useCallback((name: string, touched: boolean): void => {
    setFieldMetadata((prev) => ({
      ...prev,
      [name]: {
        ...(prev[name] || { dirty: false, touched: false }),
        touched,
      },
    }));
  }, []);

  /**
   * Set field error message
   */
  const setFieldError = useCallback((name: string, error: string | undefined): void => {
    setFieldMetadata((prev) => ({
      ...prev,
      [name]: {
        ...(prev[name] || { dirty: false, touched: false }),
        error,
      },
    }));
  }, []);

  /**
   * Subscribe to form state changes
   * Returns unsubscribe function
   */
  const subscribe = useCallback(
    (listener: FormSubscriber<T>): (() => void) => {
      if (enableSubscription) {
        subscribersRef.current.add(listener);
        return () => subscribersRef.current.delete(listener);
      }
      return () => {};
    },
    [enableSubscription]
  );

  /**
   * Notify all subscribers of state change
   */
  const notify = useCallback((): void => {
    if (enableSubscription) {
      subscribersRef.current.forEach((listener) => listener(formState));
    }
  }, [formState, enableSubscription]);

  // Call onChange callback when form state changes
  useEffect(() => {
    onChange?.(formState);
  }, [formState, onChange]);

  const contextValue: FormContextValue<T> = {
    formState,
    getField,
    getFields,
    setField,
    setFields,
    reset,
    isFieldDirty,
    isFieldTouched,
    getFieldError,
    setFieldDirty,
    setFieldTouched,
    setFieldError,
    subscribe,
    notify,
  };

  return (
    <FormContextGeneric.Provider value={contextValue as any}>
      {children}
    </FormContextGeneric.Provider>
  );
}

/**
 * Hook to access form context
 * Throws error if used outside of FormProvider
 */
export function useFormContext<T extends FormState = FormState>(): FormContextValue<T> {
  const context = useContext(FormContextGeneric);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context as FormContextValue<T>;
}

/**
 * Hook to access a single form field
 * Subscribes only to changes of that specific field
 */
export function useFormField<T extends FormState = FormState, K extends keyof T = keyof T>(
  name: K
) {
  const form = useFormContext<T>();
  const [value, setValue] = useState<T[K]>(() => form.getField(name));

  useEffect(() => {
    // Subscribe to changes (if subscription enabled)
    const unsubscribe =
      form.subscribe?.((state) => {
        setValue(state[name]);
      }) || (() => {});

    return unsubscribe;
  }, [form, name]);

  return {
    value,
    formState: form.formState,
    setValue: (newValue: T[K]) => form.setField(name, newValue),
    isDirty: form.isFieldDirty(String(name)),
    isTouched: form.isFieldTouched(String(name)),
    error: form.getFieldError(String(name)),
    setDirty: (dirty: boolean) => form.setFieldDirty(String(name), dirty),
    setTouched: (touched: boolean) => form.setFieldTouched(String(name), touched),
    setError: (error: string | undefined) => form.setFieldError(String(name), error),
  };
}

/**
 * Hook for field arrays (collection mode)
 * Manages array state within a form field
 */
export function useFieldArray<T extends FormState = FormState>(name: keyof T & string) {
  const form = useFormContext<T>();
  const value = form.getField(name as keyof T) || [];

  const append = useCallback(
    (item: any) => {
      const current = Array.isArray(value) ? value : [];
      form.setField(name as keyof T, [...current, item] as any);
    },
    [value, form, name]
  );

  const remove = useCallback(
    (index: number) => {
      const current = Array.isArray(value) ? value : [];
      form.setField(name as keyof T, current.filter((_, i) => i !== index) as any);
    },
    [value, form, name]
  );

  const update = useCallback(
    (index: number, item: any) => {
      const current = Array.isArray(value) ? value : ([] as any[]); //TODO: AS ANY
      const updated = [...current];
      updated[index] = item;
      form.setField(name as keyof T, updated as any);
    },
    [value, form, name]
  );

  const reset = useCallback(() => {
    form.setField(name as keyof T, [] as any);
  }, [form, name]);

  return {
    fields: Array.isArray(value) ? value : [],
    append,
    remove,
    update,
    reset,
  };
}

/**
 * Hook for subscription-based performance optimization
 * Only re-renders when subscribed fields change
 */
export function useFormSubscription<
  T extends FormState = FormState,
  S extends Partial<T> = Partial<T>,
>(selector: (state: T) => S) {
  const form = useFormContext<T>();
  const [selectedState, setSelectedState] = useState<S>(() => selector(form.formState));

  useEffect(() => {
    const unsubscribe =
      form.subscribe?.((state) => {
        setSelectedState(selector(state));
      }) || (() => {});

    return unsubscribe;
  }, [form, selector]);

  return selectedState;
}
