import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { paymentTransactionsConfig } from './schema';

function VerifyButton({ reference }: { reference: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await rxsoftApi.get(`/payments/verify/${reference}`);
      return data;
    },
    onSuccess: () => {
      notifications.show({ message: 'Payment verified successfully', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    },
    onError: (err: any) => {
      notifications.show({
        color: 'red',
        message: err?.response?.data?.message ?? 'Failed to verify payment',
      });
    },
  });

  return (
    <Tooltip label="Verify payment">
      <ActionIcon
        variant="light"
        color="green"
        loading={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <CheckCircle size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

export function RxPaymentTransactionsPage() {
  const config = {
    ...paymentTransactionsConfig,
    columns: [
      ...paymentTransactionsConfig.columns,
      {
        key: 'actions',
        label: '',
        render: (row: Record<string, unknown>) => (
          <Group gap="xs">
            <VerifyButton reference={row.reference as string} />
          </Group>
        ),
      },
    ],
  };

  return <DataPageShell config={config} />;
}
