import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataPageShell } from '@/features/components/page/data-page-shell';
import type { Option } from '@/features/rxsoft/types';
import { emrApi } from '@/lib/emr-api';
import { PatientRowActions } from '../../components/patients/patient-row-actions';
import type { PaymentProvider } from '../../lib/emr-types';
import { buildPatientsConfig } from './schema';

/**
 * EMR Patients — schema-forms admin page.
 *
 * Register Patient is the DataPageShell New button → ModalDataForm driven by
 * createFieldGroups in schema.tsx (no bespoke PatientForm modal).
 */
export function PatientsPage() {
  const { data: paymentProviders = [] } = useQuery({
    queryKey: ['emr', 'payment-providers'],
    queryFn: async () => {
      const res = await emrApi.get<{ data: PaymentProvider[] }>('/payment-providers', {
        params: { limit: 100 },
      });
      return res.data?.data ?? [];
    },
    staleTime: 60_000,
  });

  const paymentProviderOptions = useMemo<Option[]>(
    () =>
      paymentProviders
        .filter((p) => p.isActive)
        .map((p) => ({
          value: String(p.id),
          label: `${p.name} (${p.type})`,
        })),
    [paymentProviders]
  );

  const config = useMemo(() => {
    const base = buildPatientsConfig(paymentProviderOptions);
    return {
      ...base,
      columns: [
        ...base.columns,
        {
          key: 'actions',
          label: '',
          render: (row: Record<string, unknown>) => <PatientRowActions row={row} />,
        },
      ],
    };
  }, [paymentProviderOptions]);

  return <DataPageShell config={config} />;
}
