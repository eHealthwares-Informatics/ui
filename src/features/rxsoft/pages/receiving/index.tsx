import { Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { rxsoftApi } from '@/lib/rxsoft-api';
import { DataPageShell } from '../../../components/page/data-page-shell';
import { ReceiptDetailModal } from './detail-modal';
import { receivingConfig } from './schema';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

export function RxReceivingPage() {
  const qc = useQueryClient();
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const unpostMutation = useMutation({
    mutationFn: async ({ receiptLineId, password }: { receiptLineId: string; password: string }) => {
      await rxsoftApi.post(`/purchases/${selectedReceipt?.purchaseOrder?.id ?? selectedReceipt?.purchaseOrderId}/unpost`, {
        receiptLineId,
        password,
      });
    },
    onSuccess: () => {
      notifications.show({ message: 'Line unposted successfully.', color: 'green' });
      qc.invalidateQueries({ queryKey: ['rxsoft-data-page', '/receipts'] });
    },
    onError: (err: any) => {
      notifications.show({ message: getApiErrorMessage(err), color: 'red' });
    },
  });

  const config = useMemo(
    () => ({
      ...receivingConfig,
      columns: receivingConfig.columns.map((col) =>
        col.key === 'receiptNumber'
          ? {
              ...col,
              render: (row: any) => (
                <Anchor
                  component="button"
                  onClick={() => {
                    setSelectedReceipt(row);
                    setDetailOpen(true);
                  }}
                >
                  {row.receiptNumber}
                </Anchor>
              ),
            }
          : col,
      ),
    }),
    [],
  );

  return (
    <>
      <DataPageShell config={config} />
      <ReceiptDetailModal
        receipt={selectedReceipt}
        opened={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedReceipt(null);
        }}
        onUnpost={(receiptLineId: string, password: string) =>
          unpostMutation.mutate({ receiptLineId, password })
        }
        isUnposting={unpostMutation.isPending}
      />
    </>
  );
}
