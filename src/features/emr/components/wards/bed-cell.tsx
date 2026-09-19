import { Badge, Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';

/** Resolve a bed id to its code (cached list). */
export function BedCell({ bedId }: { bedId?: string | null }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'beds'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/beds', {
        params: { limit: 300 },
      });
      return res.data.data;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return <Skeleton height={14} width={80} />;
  }
  const bed = data.find((row) => String(row.id) === String(bedId));
  if (!bed) {
    return bedId ? <Text size="sm">{String(bedId).slice(0, 8)}</Text> : <Text size="sm">—</Text>;
  }
  return <Badge variant="light" color="teal">{String(bed.code)}</Badge>;
}