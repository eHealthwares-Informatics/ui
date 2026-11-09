/**
 * Enhanced Form Context Types
 *
 * Provides a unified, type-safe form state management system
 * with support for nested structures, computed fields, and effects.
 */

import { Field, FieldGroup as BaseFieldGroup, Option } from '@/features/rxsoft/types';

/**
 * Normalized field value types
 */
export type FieldValue =
  | string
  | number
  | boolean
  | Option
  | Option[]
  | null
  | Record<string, unknown>;

/**
 * Form state shape (generic, user-defined)
 */
export type FormState = Record<string, FieldValue>;

/**
 * Field metadata and configuration
 */
export interface FormField extends Omit<Field, 'value'> {
  value?: FieldValue;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

/**
 * Effects system for declarative data fetching and computations
 */
export type FieldGroupEffect =
  | {
      type: 'fetch';
      trigger: 'mount' | 'watch';
      watch?: string[];
      endpoint: string;
      params?: Record<string, string | number>;
      target: 'localRows' | 'formState';
      method?: 'get' | 'post';
    }
  | {
      type: 'sync-form';
      trigger: 'change';
      field: string;
      to: string;
      transform?: (value: any) => any;
    }
  | {
      type: 'compute';
      trigger: 'change' | 'mount';
      watch: string[];
      compute: (context: FormContextValue) => Record<string, any>;
    };

/**
 * Mutation mode determines how field changes are processed
 */
export type MutationMode = 'row' | 'cell' | 'collection' | 'field';

/**
 * Renderer strategy for FieldGroupEngine
 */
export type RendererType = 'default' | 'table' | 'matrix';

/**
 * Row action for matrix/table mode
 */
export interface RowAction {
  label: string;
  action: string;
  validate?: (row: Record<string, unknown>) => boolean;
}

/**
 * Declarative FieldGroup specification
 */
export interface FieldGroupSpec extends Omit<
  BaseFieldGroup,
  'endpoint' | 'renderer' | 'rowsField' | 'rowActions'
> {
  title?: string;
  formStateField?: string;
  mutationMode?: MutationMode;
  renderer?: RendererType;
  rowsField?: string;
  rowActions?: RowAction[];
  fields: Field[];
  columns?: any[]; // Column type from table
  endpoint?: {
    url: string;
    method: 'get' | 'post';
    query?: {
      when: 'mount' | 'dependency-change';
      watch: string[];
      map: Record<string, string>;
    };
  };
  effects?: FieldGroupEffect[];
  validation?: {
    schema?: any; // Zod/Yup schema
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
  };
}

/**
 * Form event payload
 */
export interface FormEvent {
  type: 'field-change' | 'field-blur' | 'field-focus' | 'action';
  field?: string;
  value?: FieldValue;
  action?: string;
  payload?: Record<string, any>;
}

/**
 * Subscriber callback for form state changes
 */
export type FormSubscriber<T extends FormState = FormState> = (state: T) => void;

/**
 * Core FormProvider context value
 */
export interface FormContextValue<T extends FormState = FormState> {
  // State accessors
  formState: T;
  getField<K extends keyof T>(name: K): T[K];
  getFields(...names: (keyof T)[]): Partial<T>;

  // State mutators
  setField<K extends keyof T>(name: K, value: T[K]): void;
  setFields(partial: Partial<T>): void;
  reset(newState?: Partial<T>): void;

  // Field metadata
  isFieldDirty(name: string): boolean;
  isFieldTouched(name: string): boolean;
  getFieldError(name: string): string | undefined;

  // Tracking
  setFieldDirty(name: string, dirty: boolean): void;
  setFieldTouched(name: string, touched: boolean): void;
  setFieldError(name: string, error: string | undefined): void;

  // Subscription (optional optimization)
  subscribe?(listener: FormSubscriber<T>): () => void;
  notify?(): void;
}

/**
 * Props for FormProvider component
 */
export interface FormProviderProps<T extends FormState = FormState> {
  children: React.ReactNode;
  initialState: T;
  onSubmit?: (state: T) => void | Promise<void>;
  onChange?: (state: T) => void;
  enableSubscription?: boolean;
}

/**
 * Mutation context passed to mutation handlers
 */
export interface MutationContext<T extends FormState = FormState> {
  form: FormContextValue<T>;
  localRows?: Record<string, any>[];
  setLocalRows?: (rows: Record<string, any>[]) => void;
  event: FormEvent;
  spec: FieldGroupSpec;
}

/**
 * Effects context for running effects
 */
export interface EffectsContext<T extends FormState = FormState> {
  form: FormContextValue<T>;
  localRows?: Record<string, any>[];
  setLocalRows?: (rows: Record<string, any>[]) => void;
  apiProvider: any; // API provider instance
}

/**
 * Row in a collection (for mutationMode: 'collection' | 'row')
 */
export interface CollectionRow {
  id?: string | number;
  [key: string]: any;
}

/**
 * Stepper/progression state
 */
export interface StepperState {
  currentStep: number;
  completedSteps: Set<number>;
  disabledSteps: Set<number>;
  totalSteps: number;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}
