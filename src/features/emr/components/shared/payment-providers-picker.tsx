import { MultiSelect } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { emrApi } from '@/lib/emr-api';
import type { PaymentProvider } from '../../lib/emr-types';

function providerLabel(provider: PaymentProvider): string {
  return `${provider.name} (${provider.type})`;
}

export function PaymentProvidersPicker({
  value,
  onChange,
  label = 'Payment providers',
  placeholder = 'Select payment providers',
  error,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: React.ReactNode;
}) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['emr', 'payment-providers'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: PaymentProvider[] }>('/payment-providers', {
        params: { limit: 100 },
      });
      return res.data?.data ?? [];
    },
    staleTime: 60_000,
  });

  const options = data
    .filter((p) => p.isActive)
    .map((p) => ({ value: p.id, label: providerLabel(p) }));

  return (
    <MultiSelect
      label={label}
      placeholder={placeholder}
      data={options}
      value={value}
      onChange={onChange}
      searchable
      clearable
      disabled={isLoading && value.length === 0}
      error={error}
    />
  );
}
