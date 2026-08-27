import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';

export type LocationOption = {
  id: string;
  code: string;
  name: string;
};

/** Resolves the current user's EMR location (from the JWT) to a displayable name/code. */
export function useCurrentLocation(locationId: string | null) {
  return useQuery({
    queryKey: ['emr', 'locations', locationId],
    queryFn: async () => {
      if (!locationId) {
        return null;
      }
      const res = await emrApi.get<{ data: LocationOption }>(`/locations/${locationId}`);
      return res.data?.data ?? res.data ?? null;
    },
    enabled: Boolean(locationId),
    staleTime: 60_000,
  });
}
