import { useMemo } from 'react';
import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Printer } from 'lucide-react';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { salesConfig } from './schema';

function CompleteSaleButton({ saleId }: { saleId: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => rxsoftApi.post(`/website/admin/complete-sale/${saleId}`),
    onSuccess: () => {
      notifications.show({ message: 'Sale completed — stock depleted.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page'] });
    },
    onError: (err: any) => {
      notifications.show({ message: err?.response?.data?.message ?? 'Failed to complete sale.', color: 'red' });
    },
  });

  return (
    <Button size="compact-xs" color="green" onClick={() => mutation.mutate()} loading={mutation.isPending}>
      Complete Sale
    </Button>
  );
}

function ViewLinesButton({ saleId }: { saleId: string }) {
  const navigate = useNavigate();
  return (
    <Tooltip label="View sales lines">
      <ActionIcon
        variant="light"
        onClick={() => navigate({ to: '/rxsoft/sales-lines', search: { saleId } })}
      >
        <Eye size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

function PrintReceiptButton({ saleId }: { saleId: string }) {
  return (
    <Tooltip label="Print receipt (PDF)">
      <ActionIcon
        variant="light"
        color="teal"
        onClick={async () => {
          try {
            const res = await rxsoftApi.get<Blob>(`/sales/${saleId}/receipt/pdf`, {
              responseType: 'blob',
            });
            const url = URL.createObjectURL(res.data);
            const win = window.open(url, '_blank');
            if (win) {
              win.onload = () => win.print();
            }
          } catch {
            notifications.show({ color: 'red', message: 'Failed to generate receipt PDF.' });
          }
        }}
      >
        <Printer size={16} />
      </ActionIcon>
    </Tooltip>
  );
}

export function RxSalesPage() {
  const config = useMemo(() => ({
    ...salesConfig,
    columns: [
      ...salesConfig.columns,
      {
        key: 'actions',
        label: 'Actions',
        render: (row: Record<string, unknown>) => {
          const saleId = row.id as string;
          const complete =
            row.saleChannel === 'mobile' && row.status === 'draft' ? (
              <CompleteSaleButton saleId={saleId} />
            ) : null;
          return (
            <Group gap="xs">
              <ViewLinesButton saleId={saleId} />
              <PrintReceiptButton saleId={saleId} />
              {complete}
            </Group>
          );
        },
      },
    ],
  }), []);

  return <DataPageShell config={config} />;
}