import { FilterType } from '@/features/rxsoft/types';

export const NO_VALUE_FILTERS = new Set<FilterType>([
  FilterType.MISSING,
  FilterType.TODAY,
  FilterType.TOMMORROW,
  FilterType.YESTERDAY,
  FilterType.NEXT_24_HOURS,
  FilterType.LAST_MONTH,
  FilterType.THIS_MONTH,
  FilterType.NEXT_MONTH,
  FilterType.THIS_YEAR,
]);

export const RANGE_FILTERS = new Set<FilterType>([FilterType.BETWEEN]);

export const isNoValueFilter = (type?: FilterType) => !!type && NO_VALUE_FILTERS.has(type);

export const isRangeFilter = (type?: FilterType) => !!type && RANGE_FILTERS.has(type);
