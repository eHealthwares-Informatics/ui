import dayjs from 'dayjs';

export type PeriodFilters = {
  from?: string;
  to?: string;
};

export function previousPeriodFilters<T extends PeriodFilters>(filters: T): T | null {
  if (!filters.from || !filters.to) {
    return null;
  }
  const from = dayjs(filters.from);
  const to = dayjs(filters.to);
  const spanDays = to.diff(from, 'day');
  if (spanDays < 1) {
    return null;
  }
  return {
    ...filters,
    from: from.subtract(spanDays + 1, 'day').format('YYYY-MM-DD'),
    to: from.subtract(1, 'day').format('YYYY-MM-DD'),
  };
}

export function pctDelta(
  current: number | undefined,
  previous: number | undefined
): number | undefined {
  if (current === undefined || previous === undefined || previous === 0) {
    return undefined;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}
