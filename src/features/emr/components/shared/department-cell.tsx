import { Badge, Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';

/** Resolve a department id to its `code — name` label (cached list). */
export function DepartmentCell({ departmentId }: { departmentId?: string | null }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'departments'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: Array<Record<string, unknown>> }>('/departments', {
        params: { limit: 200 },
      });
      return res.data.data;
    },
    staleTime: 120_000,
  });

  if (isLoading) {
    return <Skeleton height={14} width={120} />;
  }
  const department = data.find((row) => String(row.id) === String(departmentId));
  if (!department) {
    return departmentId ? (
      <Text size="sm">{String(departmentId).slice(0, 8)}</Text>
    ) : (
      <Text size="sm">—</Text>
    );
  }
  return (
    <Badge variant="light">
      {String(department.code)} — {String(department.name)}
    </Badge>
  );
}
