import { Badge, type MantineSize } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import type { PaymentProvider } from '../../lib/emr-types';

export function PaymentProvidersCell({
  ids,
  size = 'xs',
}: {
  ids: unknown;
  size?: MantineSize;
}) {
  const { data = [] } = useQuery({
    queryKey: ['emr', 'payment-providers'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: PaymentProvider[] }>('/payment-providers', {
        params: { limit: 100 },
      });
      return res.data?.data ?? [];
    },
    staleTime: 60_000,
  });

  const list = Array.isArray(ids) ? (ids as string[]) : [];
  if (!list.length) {
    return <Badge variant="outline" color="gray" size={size}>—</Badge>;
  }

  const names = list
    .map((id) => data.find((p) => p.id === id))
    .filter((p): p is PaymentProvider => Boolean(p))
    .map((p) => p.name);

  return (
    <Badge variant="light" color="teal" size={size}>
      {names.join(', ') || '—'}
    </Badge>
  );
}