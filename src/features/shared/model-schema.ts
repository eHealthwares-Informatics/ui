import type { AxiosInstance } from 'axios';
import type { Column, Field, FieldGroup, TabGroup, View } from '@/features/rxsoft/types';

export type MetricsItem = {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  format?: 'number' | 'currency';
};

export type MetricsConfig = {
  endpoint: string;
  items: (data: unknown) => MetricsItem[];
};

export type ModelConfig<T = any> = {
  id: string;
  title: string;
  description?: string;
  endpoint: string;
  columns: Column[];
  createFields?: Field[];
  createFieldGroups?: FieldGroup[];
  tabGroups?: TabGroup[];
  modalTitle?: string;
  buildCreatePayload?: (values: Record<string, unknown>) => unknown;
  buildUpdatePayload?: (values: Record<string, unknown>, row?: Record<string, unknown>) => unknown;
  buildFormState?: (row: Record<string, unknown>) => Record<string, unknown>;
  renderCreateExtras?: (args: {
    formState: Record<string, unknown>;
    updateField: (name: string, value: unknown) => void;
  }) => React.ReactNode;
  renderHeaderActions?: (args: {
    rows: Record<string, unknown>[];
    refresh: () => void;
  }) => React.ReactNode;
  transformRows?: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
  canDelete?: boolean;
  canArchive?: boolean;
  canExport?: boolean;
  csvEndpoint?: string;
  createPathBuilder?: () => string;
  detailPathBuilder?: (row: T) => string;
  editPathBuilder?: (row: T) => string;
  deletePathBuilder?: (row: T) => string;
  defaultState?: Record<string, unknown>;
  view?: View<T>;
  apiProvider?: AxiosInstance;
  minSearchLength?: number;
  debounceMs?: number;
  metricsEndpoint?: string;
  metricsConfig?: MetricsConfig;
  superAdminOrgFilter?: boolean;
  listParams?: Record<string, unknown>;
};
