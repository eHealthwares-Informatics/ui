import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import type { DashboardSummary } from '../lib/emr-types';

export function useDashboardSummary(date?: string) {
  return useQuery({
    queryKey: ['emr', 'dashboard', date],
    queryFn: async () => {
      const { data } = await emrApi.get<DashboardSummary>('/dashboard', {
        params: date ? { date } : undefined,
      });
      return data;
    },
  });
}
