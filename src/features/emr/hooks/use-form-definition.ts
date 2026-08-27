import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import type { FormDefinition } from '../lib/emr-types';

export function useFormDefinition(id: string | null | undefined) {
  return useQuery({
    queryKey: ['emr', 'form-definitions', id],
    queryFn: async () => {
      const { data } = await emrApi.get<FormDefinition>(`/form-definitions/${id}`);
      return data;
    },
    enabled: Boolean(id),
    retry: false,
  });
}
