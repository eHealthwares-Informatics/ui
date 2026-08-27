import { useQuery } from '@tanstack/react-query';
import { rxsoftApi } from '@/lib/rxsoft-api';
import type { SalesAnalytics } from '../../types';
import { fetchOptions } from '../dashboard/options';

export type SalesAnalyticsFilters = {
  from?: string;
  to?: string;
  stockLocationId?: string;
  categoryCode?: string;
  paymentMethodId?: string;
};

export function useSalesAnalytics(filters: SalesAnalyticsFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['rxsoft-sales-analytics', filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      (Object.entries(filters) as Array<[keyof SalesAnalyticsFilters, string | undefined]>).forEach(
        ([key, value]) => {
          if (value) {
            params[key] = value;
          }
        }
      );
      const { data } = await rxsoftApi.get<SalesAnalytics>('/reports/sales-analytics', { params });
      return data;
    },
  });
}

export function useGrossProfit(from?: string, to?: string, enabled = true) {
  return useQuery({
    queryKey: ['rxsoft-gross-profit', from, to],
    enabled,
    queryFn: async () => {
      const { data } = await rxsoftApi.get<{ grossProfit: number }>('/reports/income-statement', {
        params: {
          ...(from ? { fromDate: from } : {}),
          ...(to ? { toDate: to } : {}),
        },
      });
      return data.grossProfit;
    },
  });
}

export function useSalesAnalyticsFilterOptions() {
  const locations = useQuery({
    queryKey: ['sales-analytics-options', 'locations'],
    queryFn: () => fetchOptions('/stock-locations', 'id', 'name'),
  });

  const categories = useQuery({
    queryKey: ['sales-analytics-options', 'categories'],
    queryFn: () => fetchOptions('/categories', 'code', 'name'),
  });

  const paymentMethods = useQuery({
    queryKey: ['sales-analytics-options', 'payment-methods'],
    queryFn: () => fetchOptions('/payment-methods', 'id', 'name'),
  });

  return {
    locations: locations.data ?? [],
    categories: categories.data ?? [],
    paymentMethods: paymentMethods.data ?? [],
  };
}
