import { Badge, Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';

/** Resolve a ward id to its `code — name` label (cached list). */
export function WardCell({ wardId }: { wardId?: string | null }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'wards'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/wards', {
        params: { limit: 100 },
      });
      return res.data.data;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return <Skeleton height={14} width={120} />;
  }
  const ward = data.find((row) => String(row.id) === String(wardId));
  if (!ward) {
    return wardId ? <Text size="sm">{String(wardId).slice(0, 8)}</Text> : <Text size="sm">—</Text>;
  }
  return (
    <Badge variant="light">
      {String(ward.code)} — {String(ward.name)}
    </Badge>
  );
}