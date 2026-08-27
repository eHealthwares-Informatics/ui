import type { AxiosInstance } from 'axios';
import {
  Equal,
  EqualNot,
  ChevronRight,
  ChevronLeft,
  Search,
  ListFilter,
  EyeOff,
  Calendar,
  CalendarDays,
  CalendarClock,
  CalendarRange,
} from 'lucide-react';
import { ComponentType, ReactNode, SVGProps } from 'react';
import { ActionCellProps } from '../components/table/action-cell';

export type SearchControlType = 'autocomplete' | 'select';

export type SearchConfig = {
  param?: string;
  placeholder?: string;
  debounceMs?: number;
  endpoint?: string;
  queryParam?: string;
  filter?: {
    type?: string;
    field?: string;
  };
  minChars?: number;
  valueKey?: string;
  labelKey?: string;
  staticParams?: Record<string, string | number | boolean>;
  operator?: FilterType;
  staticFilters?: FilterValue[];
};
type IconType = ComponentType<SVGProps<SVGSVGElement>>;
export enum FilterType {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  FUZZY_MATCH = 'FUZZY_MATCH',
  CONTAINS = 'CONTAINS',
  MISSING = 'MISSING',
  TODAY = 'TODAY',
  TOMMORROW = 'TOMMORROW',
  YESTERDAY = 'YESTERDAY',
  NEXT_24_HOURS = 'NEXT_24_HOURS',
  LAST_MONTH = 'LAST_MONTH',
  THIS_MONTH = 'THIS_MONTH',
  NEXT_MONTH = 'NEXT_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  BETWEEN = 'BETWEEN',
}

export type ColumnFilter = {
  name: string;
  icon?: IconType;
  type: FilterType;
  filterValue?: FilterValue;
  options?: Option[];
  async_option_config?: SearchConfig;
};

export const FILTERS: Record<string, ColumnFilter> = {
  EQUALS: {
    name: 'Equals',
    icon: Equal,
    type: FilterType.EQUALS,
  },
  NOT_EQUALS: {
    name: 'Not equals',
    icon: EqualNot,
    type: FilterType.NOT_EQUALS,
  },
  GREATER_THAN: {
    name: 'Greater than',
    icon: ChevronRight,
    type: FilterType.GREATER_THAN,
  },
  GREATER_THAN_OR_EQUAL: {
    name: 'Greater than or equal',
    icon: ChevronRight,
    type: FilterType.GREATER_THAN_OR_EQUAL,
  },
  LESS_THAN: {
    name: 'Less than',
    icon: ChevronLeft,
    type: FilterType.LESS_THAN,
  },
  LESS_THAN_OR_EQUAL: {
    name: 'Less than or equal',
    icon: ChevronLeft,
    type: FilterType.LESS_THAN_OR_EQUAL,
  },

  FUZZY_MATCH: {
    name: 'Fuzzy match',
    icon: Search,
    type: FilterType.FUZZY_MATCH,
  },
  CONTAINS: {
    name: 'Contains',
    icon: ListFilter,
    type: FilterType.CONTAINS,
  },
  MISSING: {
    name: 'Missing',
    icon: EyeOff,
    type: FilterType.MISSING,
  },
  BETWEEN: {
    name: 'Between',
    icon: EyeOff,
    type: FilterType.BETWEEN,
  },

  TODAY: {
    name: 'Today',
    icon: Calendar,
    type: FilterType.TODAY,
  },
  TOMMORROW: {
    name: 'Tomorrow',
    icon: CalendarDays,
    type: FilterType.TOMMORROW,
  },
  YESTERDAY: {
    name: 'Yesterday',
    icon: CalendarClock,
    type: FilterType.YESTERDAY,
  },

  NEXT_24_HOURS: {
    name: 'Next 24 hours',
    icon: CalendarClock,
    type: FilterType.NEXT_24_HOURS,
  },

  LAST_MONTH: {
    name: 'Last month',
    icon: CalendarRange,
    type: FilterType.LAST_MONTH,
  },
  THIS_MONTH: {
    name: 'This month',
    icon: Calendar,
    type: FilterType.THIS_MONTH,
  },
  NEXT_MONTH: {
    name: 'Next month',
    icon: CalendarRange,
    type: FilterType.NEXT_MONTH,
  },
  THIS_YEAR: {
    name: 'This year',
    icon: Calendar,
    type: FilterType.THIS_YEAR,
  },
} as const;

export const ColumnTypeFilters: Record<string, ColumnFilter[]> = {
  STRING: [FILTERS.EQUALS, FILTERS.NOT_EQUALS, FILTERS.FUZZY_MATCH, FILTERS.CONTAINS],
  DATE: [
    FILTERS.EQUALS,
    FILTERS.NOT_EQUALS,
    FILTERS.GREATER_THAN,
    FILTERS.GREATER_THAN_OR_EQUAL,
    FILTERS.LESS_THAN,
    FILTERS.LESS_THAN_OR_EQUAL,
    FILTERS.TODAY,
    FILTERS.TOMMORROW,
    FILTERS.YESTERDAY,
    FILTERS.NEXT_24_HOURS,
    FILTERS.LAST_MONTH,
    FILTERS.THIS_MONTH,
    FILTERS.NEXT_MONTH,
    FILTERS.THIS_YEAR,
    FILTERS.BETWEEN,
  ],
  NUMBER: [
    FILTERS.EQUALS,
    FILTERS.NOT_EQUALS,
    FILTERS.GREATER_THAN,
    FILTERS.GREATER_THAN_OR_EQUAL,
    FILTERS.LESS_THAN,
    FILTERS.LESS_THAN_OR_EQUAL,
  ],
  BOOLEAN: [FILTERS.EQUALS, FILTERS.NOT_EQUALS],
};

export enum ColumnDataType {
  STRING,
  DATE,
  DATETIME,
  NUMBER,
  BOOLEAN,
}
export type Column = {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>, actionCellProps?: ActionCellProps) => React.ReactNode;
  dataType?: ColumnDataType;
  filters?: ColumnFilter[];
  sortable?: boolean;
  field?: Field;
  editable?: boolean;
  error?: (row: Record<string, unknown>) => string | undefined;
};

export type RendererType = 'default' | 'table' | 'matrix';

export type RowAction = {
  label: string;
  action: string;
  validate?: (row: Record<string, unknown>) => boolean;
};

export type FilterValue = {
  filter: ColumnFilter;
  value?: any;
  valueTo?: any; // for BETWEEN
};

export type Field = {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'password'
    | 'switch'
    | 'async-select'
    | 'multi-async-select'
    | 'select'
    | 'number'
    | 'email'
    | 'hidden'
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'daterange'
    | 'json'
    | 'multi-check'
    | 'multi-pick'
    | 'remote-select'
    | 'textarea'
    | 'image'
    | 'multi-image'
    | 'accordion'
    | 'accordion-array'
    | 'json-accordion-array';
  hidden?: boolean;
  disabled?: boolean;
  placeholder?: string;
  searchParam?: SearchConfig;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  col?: number;
  imageSize?: 'small' | 'medium' | 'large';
  defaultValue?: unknown;
  value?: string | { formKey: string; paramKey: string }; // value to be passed back during submission
  options?: Option[];
  toOptions?: (value: any) => Option[];
  validate?: (value: unknown) => boolean | string;
  updateField?: (row: Record<string, unknown>, name: string, value: unknown) => void;
  extraParams?: (formState: Record<string, unknown>) => Record<string, unknown>;
  itemLabelKey?: string;
  itemRender?: (item: any) => React.ReactNode;
  itemEditConfig?: any;
  relationshipId?: string;
  generateCode?: {
    mode?: 'scope' | 'prefix' | 'name';
    scope?: string;
    prefix?: string;
    seedField?: string;
    maxLength?: number;
  };
};

export type FieldGroup = {
  title?: string;
  endpoint?: {
    url: string;
    method: 'get' | 'post';
    query: { formKey: string; paramKey: string }[];
  };
  formStateField?: string;
  mergeRowToSaved?: (saved: any, row: any) => any;
  parentId?: string;
  description?: string;
  mutationMode?: 'row' | 'cell' | 'collection' | 'field';
  renderer?: RendererType;
  rowsField?: string;
  defaultState?: Record<string, unknown>;
  rowActions?: RowAction[];
  fields: Field[];
  columns?: Column[];
  matrix?: any;
  buildPayload?: (values: Record<string, unknown>) => Record<string, unknown>;
};

export type Option = {
  value: string;
  label: string;
};

export type SearchOption = Option;

export type TabGroup = {
  value: string;
  description?: string;
  disabledToolTip?: string;
  title: string;
  fields?: Field[];
  fieldGroups?: FieldGroup[];
  render?: (args: {
    formState: any;
    updateField: (name: string, value: unknown) => void;
  }) => React.ReactNode;
  rootField?: string;
  maxRows?: number;
  fetchRows?: () => { id: string | number } & Record<string, unknown>[];
  addRow?: () => { id: string | number } & Record<string, unknown>;
  removeRow?: (row: { id: string | number } & Record<string, unknown>) => void;
  waitFor?: string | ((formState: Record<string, unknown>) => boolean);
};

export type Pagination = {
  pageIndex: number;
  pageSize: number;
  total: number;
};

export type DataPageShellProps = {
  title: string;
  description?: string;
  endpoint: string;
  columns: Column[];
  modalTitle?: string;
  createFields?: Field[];
  createFieldGroups?: FieldGroup[];
  tabGroups?: TabGroup[];
  formState?: Record<string, unknown>;
  defaultState?: Record<string, unknown>;
  buildFormState?: (values: Record<string, unknown>) => Record<string, unknown>;
  updateField?: (name: string, value: unknown) => void;
  setFormState?: (state: Record<string, unknown>) => void;
  buildCreatePayload?: (values: Record<string, unknown>) => unknown;
  buildUpdatePayload?: (values: Record<string, unknown>, row: Record<string, unknown>) => unknown;
  canArchive?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  csvEndpoint?: string;
  detailPathBuilder?: (row: Record<string, unknown>) => string;
  editPathBuilder?: (row: Record<string, unknown>) => string;
  deletePathBuilder?: (row: Record<string, unknown>) => string;
  embedded?: boolean;
  apiProvider?: AxiosInstance;
  renderCreateExtras?: (args: {
    formState: Record<string, unknown>;
    updateField: (name: string, value: unknown) => void;
  }) => React.ReactNode;
  renderHeaderActions?: (args: {
    rows: Record<string, unknown>[];
    refresh: () => void;
  }) => React.ReactNode;
  onViewJson?: (row: Record<string, unknown>) => void;
  viewJson?: boolean;
  transformRows?: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
  onCreateSuccess?: (
    created: Record<string, unknown>,
    values: Record<string, unknown>
  ) => Promise<void> | void;
  allowDelete?: boolean;
};

export type DailySale = {
  day: string;
  salesCount: number;
  totalAmount: number;
};

export type SalesAnalyticsSummary = {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  itemsSold: number;
  refunds: number;
};

export type SalesAnalyticsTrendPoint = {
  day: string;
  revenue: number;
  orders: number;
};

export type SalesAnalyticsCategory = {
  code: string;
  name: string;
  revenue: number;
  orders: number;
  pct: number;
};

export type SalesAnalyticsLocation = {
  stockLocationId: string;
  name: string;
  revenue: number;
};

export type SalesAnalytics = {
  summary: SalesAnalyticsSummary;
  trend: SalesAnalyticsTrendPoint[];
  byCategory: SalesAnalyticsCategory[];
  byLocation: SalesAnalyticsLocation[];
};

export type PurchasesAnalyticsSummary = {
  totalValue: number;
  totalPOs: number;
  itemsPurchased: number;
  averagePOValue: number;
  activeSuppliers: number;
  topSupplier: { supplierId: string; name: string; value: number } | null;
};

export type PurchasesAnalyticsTrendPoint = {
  day: string;
  value: number;
  orders: number;
};

export type PurchasesAnalyticsCategory = {
  code: string;
  name: string;
  value: number;
  pct: number;
};

export type PurchasesAnalyticsSupplier = {
  supplierId: string;
  name: string;
  value: number;
};

export type PurchasesAnalyticsLocation = {
  warehouseId: string;
  name: string;
  value: number;
  pct: number;
};

export type PurchasesAnalyticsStatus = {
  status: string;
  count: number;
};

export type PurchasesAnalyticsRecentPurchase = {
  id: string;
  purchaseOrderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  supplierName: string | null;
};

export type PurchasesAnalytics = {
  summary: PurchasesAnalyticsSummary;
  trend: PurchasesAnalyticsTrendPoint[];
  byCategory: PurchasesAnalyticsCategory[];
  bySupplier: PurchasesAnalyticsSupplier[];
  byLocation: PurchasesAnalyticsLocation[];
  byStatus: PurchasesAnalyticsStatus[];
  recent: PurchasesAnalyticsRecentPurchase[];
};

export type InventoryValuation = {
  itemsCount: number;
  totalQuantity: number;
};

export type TopProduct = {
  productCode: string;
  quantitySold: number;
  revenue: number;
};

// types/view.ts
export type ViewRelationField<T> = {
  key: keyof T & string;
  label: string;
  col?: number;
  type: 'relation';
  render: (items: any[], item: T) => ReactNode;
};

export type ViewField<T> =
  | {
      key: keyof T | string;
      label: string;
      col?: number;
      type?: 'field';
      render?: (value: any, item: T) => ReactNode;
    }
  | ViewRelationField<T>;

export type ViewFieldGroup<T> = {
  title?: string;
  fields: ViewField<T>[];
};

export type ViewListColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
};

export type ViewList<T> = {
  key: keyof T | string;
  title: string;
  columns: ViewListColumn<any>[];
  footer?: (rows: any[]) => ReactNode;
};

export type ViewAccordion<T> = {
  key: keyof T | string;
  title: string;
  labelKey?: string;
  renderLabel?: (item: any) => ReactNode;
  itemEditConfig?: any;
  itemFields?: string[];
  itemEditEndpoint?: (data: any, item: any) => string;
  canEditItem?: (data: any, item: any) => boolean;
};

export type View<T> = {
  endpoint: string;
  title?: string;

  // top level fields
  fields?: ViewField<T>[];

  // grouped sections
  fieldGroups?: ViewFieldGroup<T>[];

  // table sections
  lists?: ViewList<T>[];

  // accordion sections
  accordions?: ViewAccordion<T>[];

  // ModelConfig used to render the edit form for this view
  editConfig?: any;
};
export const RELATION_FILTER = (searchParam: SearchConfig): ColumnFilter[] => [
  {
    name: 'Equals',
    icon: Equal,
    type: FilterType.EQUALS,
    async_option_config: searchParam,
  },
];

export const SUPPLIER_FILTER = RELATION_FILTER({
  endpoint: '/customers',
  queryParam: 'search',
  valueKey: 'id',
  labelKey: 'name',
  minChars: 2,
});

export const WAREHOUSE_FILTER = RELATION_FILTER({
  endpoint: '/stock-locations',
  queryParam: 'search',
  valueKey: 'id',
  labelKey: 'name',
  minChars: 0,
});

export const EQUALS_WITH_OPTIONS = (options: Option[]) => [
  {
    name: 'Equals',
    icon: Equal,
    type: FilterType.EQUALS,
    options,
  },
];
