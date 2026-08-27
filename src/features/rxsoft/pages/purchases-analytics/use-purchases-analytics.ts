import { useQuery } from '@tanstack/react-query';
import { rxsoftApi } from '@/lib/rxsoft-api';
import type { PurchasesAnalytics } from '../../types';
import { fetchOptions } from '../dashboard/options';

export type PurchasesAnalyticsFilters = {
  from?: string;
  to?: string;
  warehouseId?: string;
  categoryCode?: string;
  supplierId?: string;
};

export function usePurchasesAnalytics(
  filters: PurchasesAnalyticsFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['rxsoft-purchases-analytics', filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      (
        Object.entries(filters) as Array<[keyof PurchasesAnalyticsFilters, string | undefined]>
      ).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });
      const { data } = await rxsoftApi.get<PurchasesAnalytics>('/reports/purchases-analytics', {
        params,
      });
      return data;
    },
  });
}

export function usePurchasesAnalyticsFilterOptions() {
  const warehouses = useQuery({
    queryKey: ['purchases-analytics-options', 'warehouses'],
    queryFn: () => fetchOptions('/warehouses', 'id', 'name'),
  });

  const categories = useQuery({
    queryKey: ['purchases-analytics-options', 'categories'],
    queryFn: () => fetchOptions('/categories', 'code', 'name'),
  });

  const suppliers = useQuery({
    queryKey: ['purchases-analytics-options', 'suppliers'],
    queryFn: () => fetchOptions('/suppliers', 'id', 'name'),
  });

  return {
    warehouses: warehouses.data ?? [],
    categories: categories.data ?? [],
    suppliers: suppliers.data ?? [],
  };
}
